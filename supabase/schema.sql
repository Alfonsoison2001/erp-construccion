-- ============================================
-- ERP de Control de Presupuestos y Remesas
-- Schema SQL para Supabase
-- ============================================

-- Perfiles de usuario (extiende auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operador')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: auto-crear perfil al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'operador');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Proyectos
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  owner_name TEXT,
  start_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Asignación de operadores a proyectos
CREATE TABLE project_operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(project_id, operator_id)
);

-- Catálogo de categorías (por proyecto)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Catálogo de conceptos/subcategorías
CREATE TABLE concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Presupuesto
CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  concept_id UUID REFERENCES concepts(id),
  detail TEXT,
  supplier TEXT,
  unit TEXT,
  quantity DECIMAL(15,4),
  currency TEXT DEFAULT 'MXN' CHECK (currency IN ('MXN', 'USD', 'EUR')),
  unit_price DECIMAL(15,2),
  subtotal DECIMAL(15,2),
  surcharge_pct DECIMAL(5,2) DEFAULT 0,
  surcharge_amount DECIMAL(15,2) DEFAULT 0,
  vat_pct DECIMAL(5,2) DEFAULT 0,
  vat_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2),
  exchange_rate DECIMAL(10,4) DEFAULT 1,
  total_mxn DECIMAL(15,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catálogo de proveedores/contratistas
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bank TEXT,
  account_number TEXT,
  clabe TEXT,
  notes TEXT
);

-- Tipos de cambio históricos
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'EUR')),
  rate DECIMAL(10,4) NOT NULL,
  UNIQUE(date, currency)
);

-- Remesas
CREATE TABLE remesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  remesa_number INTEGER NOT NULL,
  remesa_suffix TEXT DEFAULT 'MN',
  date DATE NOT NULL,
  week_description TEXT,
  status TEXT DEFAULT 'borrador' CHECK (status IN ('borrador', 'enviada', 'pagada_parcial', 'pagada')),
  total_amount DECIMAL(15,2) DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, remesa_number, remesa_suffix)
);

-- Líneas de remesa
CREATE TABLE remesa_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remesa_id UUID REFERENCES remesas(id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (section IN ('A', 'B')),
  line_number INTEGER NOT NULL,
  category_id UUID REFERENCES categories(id),
  concept_id UUID REFERENCES concepts(id),
  contractor_id UUID REFERENCES contractors(id),
  contractor_name TEXT,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  vat_pct DECIMAL(5,2) DEFAULT 0,
  vat_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('transferencia', 'cheque', 'efectivo')),
  bank TEXT,
  account_number TEXT,
  clabe TEXT,
  notes TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: auto-recalcular total de remesa al modificar líneas
CREATE OR REPLACE FUNCTION update_remesa_total()
RETURNS TRIGGER AS $$
DECLARE
  target_remesa_id UUID;
BEGIN
  target_remesa_id := COALESCE(NEW.remesa_id, OLD.remesa_id);
  UPDATE remesas
  SET total_amount = (
    SELECT COALESCE(SUM(total), 0) FROM remesa_items WHERE remesa_id = target_remesa_id
  )
  WHERE id = target_remesa_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_remesa_item_change
  AFTER INSERT OR UPDATE OR DELETE ON remesa_items
  FOR EACH ROW EXECUTE FUNCTION update_remesa_total();

-- Vista: presupuesto vs pagado por categoría (con subquery para evitar duplicación)
CREATE OR REPLACE VIEW budget_vs_paid AS
SELECT
  b.project_id,
  b.category_id,
  c.name AS category_name,
  b.concept_id,
  co.name AS concept_name,
  SUM(b.total_mxn) AS budget_total,
  (
    SELECT COALESCE(SUM(ri.total), 0)
    FROM remesa_items ri
    JOIN remesas r ON ri.remesa_id = r.id
    WHERE ri.category_id = b.category_id
      AND (b.concept_id IS NULL OR ri.concept_id = b.concept_id)
      AND ri.is_approved = TRUE
      AND r.project_id = b.project_id
  ) AS paid_total
FROM budget_items b
JOIN categories c ON b.category_id = c.id
LEFT JOIN concepts co ON b.concept_id = co.id
GROUP BY b.project_id, b.category_id, c.name, b.concept_id, co.name;

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE remesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE remesa_items ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Users can read all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Projects: admin full access, operators see assigned
CREATE POLICY "Admin full access to projects" ON projects FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Operators see assigned projects" ON projects FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_operators
    WHERE project_id = projects.id AND operator_id = auth.uid()
  )
);

-- Project operators: admin manages, operators see own
CREATE POLICY "Admin manages project operators" ON project_operators FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Operators see own assignments" ON project_operators FOR SELECT USING (
  operator_id = auth.uid()
);

-- Categories: admin manages, operators can read for their projects
CREATE POLICY "Admin manages categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Operators read categories of assigned projects" ON categories FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_operators
    WHERE project_id = categories.project_id AND operator_id = auth.uid()
  )
);

-- Concepts: admin manages, operators can read
CREATE POLICY "Admin manages concepts" ON concepts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Operators read concepts" ON concepts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_operators po
    JOIN categories cat ON cat.project_id = po.project_id
    WHERE cat.id = concepts.category_id AND po.operator_id = auth.uid()
  )
);

-- Budget items: admin only
CREATE POLICY "Admin manages budget items" ON budget_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Contractors: admin manages, operators read for their projects
CREATE POLICY "Admin manages contractors" ON contractors FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Operators read contractors" ON contractors FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_operators
    WHERE project_id = contractors.project_id AND operator_id = auth.uid()
  )
);

-- Exchange rates: admin manages, all read
CREATE POLICY "Admin manages exchange rates" ON exchange_rates FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "All users read exchange rates" ON exchange_rates FOR SELECT USING (true);

-- Remesas: admin full access, operators manage own project remesas
CREATE POLICY "Admin full access to remesas" ON remesas FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Operators read own project remesas" ON remesas FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_operators
    WHERE project_id = remesas.project_id AND operator_id = auth.uid()
  )
);
CREATE POLICY "Operators create remesas for own projects" ON remesas FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_operators
    WHERE project_id = remesas.project_id AND operator_id = auth.uid()
  )
);
CREATE POLICY "Operators update own draft remesas" ON remesas FOR UPDATE USING (
  created_by = auth.uid() AND status = 'borrador'
);

-- Remesa items: admin full access, operators manage items in their remesas
CREATE POLICY "Admin full access to remesa items" ON remesa_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Operators read own remesa items" ON remesa_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM remesas r
    JOIN project_operators po ON po.project_id = r.project_id
    WHERE r.id = remesa_items.remesa_id AND po.operator_id = auth.uid()
  )
);
CREATE POLICY "Operators manage items in own draft remesas" ON remesa_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM remesas r
    WHERE r.id = remesa_items.remesa_id AND r.created_by = auth.uid() AND r.status = 'borrador'
  )
);
CREATE POLICY "Operators update items in own draft remesas" ON remesa_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM remesas r
    WHERE r.id = remesa_items.remesa_id AND r.created_by = auth.uid() AND r.status = 'borrador'
  )
);
CREATE POLICY "Operators delete items in own draft remesas" ON remesa_items FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM remesas r
    WHERE r.id = remesa_items.remesa_id AND r.created_by = auth.uid() AND r.status = 'borrador'
  )
);

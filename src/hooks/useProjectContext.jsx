import { createContext, useContext, useState, useEffect } from 'react'

const ProjectContext = createContext(null)

export function ProjectProvider({ children }) {
  const [currentProject, setCurrentProject] = useState(() => {
    const saved = localStorage.getItem('currentProject')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    if (currentProject) {
      localStorage.setItem('currentProject', JSON.stringify(currentProject))
    } else {
      localStorage.removeItem('currentProject')
    }
  }, [currentProject])

  return (
    <ProjectContext.Provider value={{ currentProject, setCurrentProject }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (!context) throw new Error('useProject must be used within ProjectProvider')
  return context
}

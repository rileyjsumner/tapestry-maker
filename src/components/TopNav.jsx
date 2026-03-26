function TopNav({ onNewProject }) {
  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <button type="button" onClick={onNewProject}>
          New Project
        </button>
      </div>
    </header>
  )
}

export default TopNav


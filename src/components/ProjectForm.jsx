function ProjectForm({
  projectName,
  widthInput,
  heightInput,
  onProjectNameChange,
  onWidthChange,
  onHeightChange,
  onSubmit,
  errorMessage,
}) {
  return (
    <>
      <h1>Crochet Pixel Editor</h1>
      <p className="subtitle">Create a project and generate your tapestry grid.</p>

      <form className="project-form" onSubmit={onSubmit}>
        <label htmlFor="projectName">Project Name</label>
        <input
          id="projectName"
          type="text"
          value={projectName}
          onChange={(event) => onProjectNameChange(event.target.value)}
          placeholder="My Tapestry"
        />

        <label htmlFor="gridWidth">Grid Width (cells)</label>
        <input
          id="gridWidth"
          type="number"
          min="1"
          step="1"
          value={widthInput}
          onChange={(event) => onWidthChange(event.target.value)}
        />

        <label htmlFor="gridHeight">Grid Height (cells)</label>
        <input
          id="gridHeight"
          type="number"
          min="1"
          step="1"
          value={heightInput}
          onChange={(event) => onHeightChange(event.target.value)}
        />

        <button type="submit">Create Project</button>
      </form>

      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </>
  )
}

export default ProjectForm

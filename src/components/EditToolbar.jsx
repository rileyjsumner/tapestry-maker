function EditToolbar({
  editTool,
  onEditToolChange,
  onOpenMergeModal,
}) {
  return (
    <div className="edit-toolbar">
      <div className="edit-tool-buttons">
        <button
          type="button"
          className={`edit-tool-btn ${editTool === 'brush' ? 'is-active' : ''}`}
          onClick={() => onEditToolChange('brush')}
          title="Brush tool"
        >
          Brush
        </button>
        <button
          type="button"
          className={`edit-tool-btn ${editTool === 'eraser' ? 'is-active' : ''}`}
          onClick={() => onEditToolChange('eraser')}
          title="Eraser tool"
        >
          Eraser
        </button>
      </div>
      <button
        type="button"
        className="edit-merge-btn"
        onClick={onOpenMergeModal}
        title="Merge multiple brushes"
      >
        Merge...
      </button>
    </div>
  )
}

export default EditToolbar

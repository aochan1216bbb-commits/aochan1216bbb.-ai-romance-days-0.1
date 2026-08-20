// Shared relationship facade.
window.GameSystems=window.GameSystems||{};
window.GameSystems.relationship={
 index(){return typeof relationshipIndex==='function'?relationshipIndex():0},
 label(){return typeof relationshipLabel==='function'?relationshipLabel():''}
};

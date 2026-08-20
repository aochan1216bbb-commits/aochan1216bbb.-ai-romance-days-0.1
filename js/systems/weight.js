// Shared weight/body-stage facade.
window.GameSystems=window.GameSystems||{};
window.GameSystems.weight={
 stage(){return typeof stageNum==='function'?stageNum():1},
 type(){return typeof bodyType==='function'?bodyType():''}
};

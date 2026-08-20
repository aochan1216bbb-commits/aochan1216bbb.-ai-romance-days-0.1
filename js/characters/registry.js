// Character hook registry.
// Shared systems call these hooks instead of growing new character-specific branches.
// Existing v36 behavior is preserved; hooks are an extension point for future refactors.
window.CharacterHooks={
 get(id){return window.CHARACTER_MODULES?.[id]?.hooks||{}},
 call(id,name,...args){
   const fn=this.get(id)[name];
   return typeof fn==='function'?fn(...args):undefined;
 }
};

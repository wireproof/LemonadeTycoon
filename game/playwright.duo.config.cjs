const base=require('./playwright.config.cjs');module.exports={...base,testMatch:'**/duo.spec.cjs',projects:[{name:'webkit',use:{browserName:'webkit'}}]};

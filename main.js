'use strict';
const LoaderMain = require("./ind/main/LoaderMain").LoaderMain;
const PackerMain = require('./ind/packer/PackerMain').PackerMain;
const StringTool = require('./ec/common/StringTool').StringTool;
const SystemConfig = require('./system.json');


if(process.argv.length >= 3){
   if(process.argv[2].indexOf("http") >= 0 ){
      main();
   } else {
      const stringTool = new StringTool();
      if(stringTool.isNumber(process.argv[2])) {
        packPdf();
      } 
   }
}

async function  main(){
   var processor = new LoaderMain();
   processor.process(SystemConfig);
}

function packPdf(){
   const packer = new PackerMain();
   packer.process(SystemConfig);
}
'use strict'
const ApplicationMain = require('../../ec/system/ApplicationMain').ApplicationMain;
const EcDirectory = require('../../ec/common/EcDirectory').EcDirectory;
const StringTool = require('../../ec/common/StringTool').StringTool;
const PDF = require("../../ec/doc/pdf/PDF").PDF; 
const mapping = require('../../mapping.json');

class PackerMain extends ApplicationMain {

    stringTool = new StringTool();
    app_workspace = null;
    book_workspace = null;
    package_workspace = null;

    constructor(){
        super();
        
    }

    async main(args){
        const bookId = args.length > 0 ? args[0] : "26039";
        this.app_workspace = new EcDirectory(this.AppConfig().WorkSpace,true);
        this.book_workspace = new EcDirectory(this.app_workspace.Uri() + bookId,true);
        this.package_workspace = new EcDirectory(this.app_workspace.Uri() + bookId + "/" + this.AppConfig().PackageDirectoryName,true);
        const chapterItems = this.book_workspace.viewFiles().filter(item => item.isfolder && item.name != this.AppConfig().PackageDirectoryName)
        .map(item => {
            return {
                chapterType : item.name.substring(0,1) , 
                chapterNo : parseInt(item.name.substr(1)) , 
                folderName : item.name
            }
        });

        if(this.AppConfig().IsProduction){
           this.packPackedChapter(chapterItems);
        }
       
        if(this.AppConfig().IsProduction){
            this.packSingleChapter(chapterItems);
        }
    }
    packPackedChapter(chapterItems){
        const symbo = mapping.Symbos[0].OutputSymbo;
        const packagedChapters = chapterItems.filter(item => item.chapterType == symbo)
        .sort(
            (item1 , item2) =>  item1.chapterNo - item2.chapterNo
        );
        this.log("PackagedChapters = " , packagedChapters);
        for(var i in packagedChapters){
            const imageAr = [];
            const chapter = packagedChapters[i];
            const chapterDirectory = new EcDirectory(this.book_workspace.Uri() + chapter.folderName);
            const images = chapterDirectory.viewFiles().sort(
                ( item1 , item2) => {
                    const v1 = this.stringTool.regSearch("(.*?)\\.(.*?)",item1.name);
                    const v2 = this.stringTool.regSearch("(.*?)\\.(.*?)",item2.name);
                    return parseInt(v1) - parseInt(v2);
                }
            );
            images.forEach(image => imageAr.push(chapterDirectory.Uri() + image.name));
            const p = "00000" + (i+1);
            this.flushToPDF(this.package_workspace.Uri() + "A" + p.substring(p.length - 3) + ".pdf" , imageAr);
        }

    }
    packSingleChapter(chapterItems){
        const symbo = mapping.Symbos[1].OutputSymbo;
        const singleChapters = chapterItems.filter(item => item.chapterType == symbo)
        .sort(
            (item1 , item2) =>  item1.chapterNo - item2.chapterNo
        );
        this.log("SingleChapters = " , singleChapters);
        var packedIndex = 1;
        var groupCount = 0;
        var imageAr = [];
        for(var i in singleChapters){
            const chapter = singleChapters[i];
            const chapterDirectory = new EcDirectory(this.book_workspace.Uri() + chapter.folderName);
            const images = chapterDirectory.viewFiles().sort(
                ( item1 , item2) => {
                    const v1 = this.stringTool.regSearch("(.*?)\\.(.*?)",item1.name);
                    const v2 = this.stringTool.regSearch("(.*?)\\.(.*?)",item2.name);
                    return parseInt(v1) - parseInt(v2);
                }
            );
            images.forEach(image => imageAr.push(chapterDirectory.Uri() + image.name));

            groupCount++;
            if(groupCount >= 7){
                const p = "00000" + packedIndex;
                this.flushToPDF(this.package_workspace.Uri() + "B" + p.substring(p.length - 3) + ".pdf" , imageAr);
                packedIndex++;
                imageAr = [];
                groupCount = 0;
            }
        }
        if(imageAr.length > 0) {
            const p = "00000" + packedIndex;
            this.flushToPDF(this.package_workspace.Uri() + "B" + p.substring(p.length - 3) + ".pdf" , imageAr);
        }
    }

    flushToPDF (pdfPath , imageArray) {
        this.log("Output To PDF = " + pdfPath);
        var pdf = undefined;
        imageArray.forEach(
            imgUri => {
                this.log("Pack [" + imgUri + "] to " + pdfPath);
                if(!pdf) {
                    pdf = new PDF(pdfPath);
                    const p1 = pdf.getNowPage();
                    p1.addImage(imgUri);
                } else {
                    const p2 = pdf.newPage();
                    p2.addImage(imgUri);
                }
            }
        );
        pdf.close();
    }

}

module.exports.PackerMain = PackerMain;

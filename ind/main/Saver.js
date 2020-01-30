'use strict'
const Basis = require("../../ec/system/Basis").Basis;
const EcDirectory = require('../../ec/common/EcDirectory').EcDirectory;
const StringTool = require('../../ec/common/StringTool').StringTool;
const HttpClient = require('../../ec/net/HttpClient').HttpClient;
const FileTool = require('../../ec/common/FileTool').FileTool;
const mapping = require('../../mapping.json');

class Saver extends Basis{
    workspace = null;
    /**
     * 
     * @param EcDirectory workspace 
     * Base on Bookid
     */
    constructor(workspace){
        super();
        this.workspace = workspace;
    }

    /**
     * 
     * @param {*} chapter 
     * {
     *      title : title,
     *      link : https://www.k886.net/index-look-name-黑色四葉草-cid-26039-id-186567,
     *      chapterNo : chapterNo,
     *      chapterID : chapterId
     * }
     * 
     * @param [*] chapterImages 
     * {
     *      pageNo : pageNo,
     *      image : imageUrl
     *  }
     * 
     */
    async saveChapterImages(chapter , chapterImages){
        const fileTool = new FileTool();
        const pureChapterNo = this.toPureChapterNo(chapter.chapterNo);
        const typeSymbo = this.toCollectionTypeSymbo(chapter.chapterNo);
        const chapterWorkspace = new EcDirectory(this.workspace.Uri() + typeSymbo + pureChapterNo,true);
        const http = new HttpClient();
        var downloadSuccessCpunt = 0;
        for(var i in chapterImages){
            const chapterImg = chapterImages[i];
            const suffix = this.toFileSuffix(chapterImg.image);
            const fmtPageNo = this.toFmtPageNo(chapterImg.pageNo);
            const saveTo = chapterWorkspace.Uri() + fmtPageNo + "." + suffix;
            this.log("Save[" + chapterImg.image + "] to " + saveTo);
            try {
                if(!fileTool.isFileExist(saveTo)){
                    await http.download( chapterImg.image , saveTo);
                    await this.hold(2 * 1000);
                } else {
                    this.log("File[" + saveTo + "] has been downloaded!! Skip it");
                }
                downloadSuccessCpunt++;
            } catch (err){
                this.log("Donwload Fail , error = ",err);
                break;
            }
        }
        const history = {
            title : chapter.title,
            link : chapter.link,
            chapterNo : chapter.chapterNo,
            chapterID : chapter.chapterID,
            pages : chapterImages.length,
            saved : downloadSuccessCpunt
        }
        this.writeHistory(history);
    }

    writeHistory(history){
        this.log("Write History!!");
        const fileTool = new FileTool();
        fileTool.writeFile(this.workspace.Uri() + this.AppConfig().HistroyInfoFile , JSON.stringify(history) + "\r\n" , true);
    }

    toFmtPageNo(pageNo){
        const t = "0000" + pageNo;
        return t.substring(t.length - 5 , t.length);
    }

    toFileSuffix(imageUrl){
        const strTool = new StringTool();
        var suffix = "jpg"; // U => Undefined
        mapping.FileSuffix.every(element => {
            var regString = "[" + element.InputSymbos.join("|") + "]";
            if(strTool.regValidate(regString,imageUrl)){
                suffix = element.OutputSymbo;
                this.log("Notice Suffix [" + suffix + "] from Image Url[" + imageUrl + "]");
                return false;
            } else return true;
        });
        return suffix;
    }

    toPureChapterNo(chapterNo){
        const strTool = new StringTool();
        const chapaterChars = Array.from(chapterNo);
        const ar = [];
        chapaterChars.forEach(
            char => {
                if(strTool.regValidate('[0-9]',char)){
                    ar.push(char);
                }
            }
        );
        const pureChapterNo = ar.join("");
        const fmt = "000000" + pureChapterNo;
        return fmt.substring(fmt.length - 5,fmt.length);
    }

    toCollectionTypeSymbo(chapterNo){
        const strTool = new StringTool();
        var symbo = "U"; // U => Undefined
        mapping.Symbos.every(element => {
            var regString = "[" + element.InputSymbos.join("|") + "]";
            if(strTool.regValidate(regString,chapterNo)){
                this.log("Notice [" + element.Alias + "] from ChapterNo[" + chapterNo + "]");
                symbo = element.OutputSymbo;
                return false;
            } else return true;
        });
        if(symbo == 'U') {
            this.log("Meet undefined symbo from remote ChapterNo[" + chapterNo + "] ");
        }
        return symbo;
    }

}


module.exports.Saver = Saver;
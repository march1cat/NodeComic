'use strict'
const ApplicationMain = require("../../ec/system/ApplicationMain").ApplicationMain;
const ChapterPicker = require("../k886/ChapterPicker").ChapterPicker;
const ChapterParser = require("../k886/ChapterParser").ChapterParser;
const EcDirectory = require('../../ec/common/EcDirectory').EcDirectory;
const FileTool = require('../../ec/common/FileTool').FileTool;
const Saver = require("./Saver").Saver;

class LoaderMain extends ApplicationMain {

    constructor(){
        super();
    }
    async main(args){
        const inputUrl = args.length >= 1 ? args[0] : "https://www.k886.net/index-comic-name-黑色四葉草-id-26039";
        this.log("Todo Book Index = " + inputUrl);
        const chapterPicker = new ChapterPicker();
        const [bookInfo , chapters] = await chapterPicker.pick(inputUrl);
        if(chapters) {
            this.log("Chapter pick success , notice [" + chapters.length + "] chapters");
            const workspace = this.initBookWorkSpace(bookInfo);
            const toDoChapters = await this.filterDownadloadedChapter(workspace,chapters);
            this.log("Chapter filter success , notice [" + toDoChapters.length + "] unhandled chapters");

            const saver = new Saver(workspace);
            for (var i in toDoChapters){
                const chapter = toDoChapters[i];
                await this.hold(3 * 1000);
                this.log("Start handle " , chapter);
                const chapterParser = new ChapterParser();
                const chapterImages = await chapterParser.parse(chapter);
                saver.saveChapterImages(chapter , chapterImages);
                if(!this.AppConfig().IsProduction) break;
            }
        } else {
            this.log("Chapter pick fail , please check Chapter Picker!!");
        }
    }

    async filterDownadloadedChapter(workspace , chapters){
        const fileTool = new FileTool();
        try {
            const lines = await fileTool.readFileInLines(workspace.Uri() + this.AppConfig().HistroyInfoFile);
            const historyRecords = [];
            for(var i in lines){
                const line = lines[i];
                try {
                    historyRecords.push(JSON.parse(line));
                } catch(err){
                    this.log("Load history fail ,error = " , err);
                }
            }
            this.log("Notice history amount = " + historyRecords.length);
            return chapters.filter(
                chapter => {
                    const matchHistoryRecord = historyRecords.find(
                        hisRecord => {
                            return hisRecord.pages == hisRecord.saved && hisRecord.chapterID === chapter.chapterID;
                        }
                    );
                    if(matchHistoryRecord) {
                        this.log("Filter handled chapter , " , chapter);
                        return false;
                    } else return true;
                }
            );
        } catch (err){
            this.log("Filter downloaded chpaters fail , error = " , err);
            return chapters;
        }
    }

    initBookWorkSpace(bookInfo){
        const loaderWorkspace = new EcDirectory(this.AppConfig().WorkSpace,true);
        const workspace = new EcDirectory(loaderWorkspace.Uri() + bookInfo.id,true);
        const fileTool = new FileTool();
        const readMeFileUri = workspace.Uri() + this.AppConfig().BookBasisInfoFile;
        if(!fileTool.isFileExist(readMeFileUri)){
            this.log("ReadMe[" + readMeFileUri + "] not exist, generate it!!");
            fileTool.writeFile(readMeFileUri , JSON.stringify(bookInfo));
        }
        return workspace;
    }
}

module.exports.LoaderMain = LoaderMain;

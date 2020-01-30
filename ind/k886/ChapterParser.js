'use strict'
const Basis = require("../../ec/system/Basis").Basis;
const StringTool = require('../../ec/common/StringTool').StringTool;
const HttpClient = require('../../ec/net/HttpClient').HttpClient;

class ChapterParser extends Basis {
    constructor(){
        super();
    }

    /**
     * 
     * @param {*} chapter 
     * {
     *      title : title,
     *      link : https://www.k886.net/index-look-name-黑色四葉草-cid-26039-id-186567,
     *      chapterNo : chapterNo,
     *      chapterId : chapterId
     * }
     */
    async parse(chapter) {
        var stringTool = new StringTool();
        var link = chapter.link;
        var keys = stringTool.regSearch("index-look-name-(.*?)-cid-(.*?)-id-(.*?)-",link + "-");
        const bookNameChi = keys[1];
        const bookID = keys[2];
        const chapterID = keys[3];
        const url = "https://www.k886.net/index-look-name-" + encodeURIComponent(bookNameChi)  + "-cid-" + bookID + "-id-" + chapterID;
        try {
            const http = new HttpClient();
            const [pageDom , bodyText] = await http.getAsDom(url);
            const pageAmount = this.calcuratePageAmount(pageDom);
            this.log("Notice Book[" + bookNameChi + "] Chapter[" + chapter.chapterNo + "] Page Amount = " + pageAmount);
            if(pageAmount > 0){
                const chapterImages = [];
                for(var i = 1 ; i < pageAmount;i++){
                    await this.hold(3 * 1000);
                    const includeImgPageUrl = url + "-p-" + i;
                    const imageUrl = await this.calcurateImageRealUrl(includeImgPageUrl);
                    chapterImages.push(
                        {
                            pageNo : i,
                            image : imageUrl
                        }
                    );
                    if(!this.AppConfig().IsProduction) break;
                }
                return chapterImages;
            }
        } catch (e){
            this.log(e);
        }
    }


    calcuratePageAmount(pageDom){
        const pageSelectDom = pageDom.querySelector("select[name=select1]");
        const pageOptionDoms = pageSelectDom.getElementsByTagName("option");
        const pageAmount = pageOptionDoms.length;
        return pageAmount;
    }


    async calcurateImageRealUrl(url){
        const http = new HttpClient();
        const [pageDom , bodyText] = await http.getAsDom(url);
        const imageDom = pageDom.querySelector("img#ComicPic");
        const imageUrl = imageDom.getAttribute('src');
        return imageUrl;
    }


    download(){

    }




}

module.exports.ChapterParser = ChapterParser;
'use strict'
const Basis = require("../../ec/system/Basis").Basis;
const StringTool = require('../../ec/common/StringTool').StringTool;
const HttpClient = require('../../ec/net/HttpClient').HttpClient;


class ChapterPicker extends Basis{
    constructor(){
        super();
    }
    /*
    //Sample Url : 
    // https://www.k886.net/index-comic-name-黑色四葉草-id-26039
    */
    
    async pick(chaptersUrl){
        var stringTool = new StringTool();
        var keys = stringTool.regSearch("index-comic-name-(.*?)-id-(.*?)-" , chaptersUrl + "-");
        const bookNameChi = keys[1];
        const bookID = keys[2];
        const url = "https://www.k886.net/index-comic-name-" + encodeURIComponent(bookNameChi)  + "-id-" + bookID;
        const bookInfo = {
            name : bookNameChi , 
            id : bookID,
            index : chaptersUrl
        };
        const chapters = [];
        try {
           const http = new HttpClient();
           const [pageDom , bodyText] = await http.getAsDom(url);
           const linkContainerDom = pageDom.querySelector("ul.b1");
           const chapterLinkTag = linkContainerDom.getElementsByTagName("a");
           for(var i = 0 ; i < chapterLinkTag.length; i++){
             const alink = chapterLinkTag.item(i);
             const link = alink.getAttribute('href');
             const chapterLinkKeys = stringTool.regSearch("index-look-name-(.*?)-cid-(.*?)-id-(.*?)-",link + "-");

             const chapter = {
                title : alink.getAttribute('title'),
                link : link,
                chapterNo : alink.innerHTML,
                chapterID : chapterLinkKeys[3]
             }
             chapters.push(chapter);
           }
           return [bookInfo , chapters];
        } catch(e){
            this.log("Chapter pick error = " , e);
        }
    }
}

module.exports.ChapterPicker = ChapterPicker;


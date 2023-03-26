    /* 
    gameStage:
        0: before word list loaded / no available word list
        1: prepared to start. Can accept Start action
        2: game running.
        3: game finished, all word tested, ready to back to stage 1
        4: help window popped
        */
var GameStage = {
    notReady: 0,
    loadingWordList: 2,
    readyToRun: 5,
    runningP: 10,
    prepareE: 20,
    runningE: 25,
    finishedP: 30,
    finishedE: 40,
    pausing: 100,
    helpPopped: 999
}

G.F.getExamSpeed = function (o) {
    return 7 + (o.Chinese.length + o.English.length) * 0.3; 
}

var GobVisiblityMapping = {
    notReady: ['wordLoader', 'help', 'helpPointer', 'copyright'],
    loadingWordList: ['wordLoadingForm'],
    readyToRun: ['startParticipate', 'startExam', 'wordLoader', 'help', 'timer', 'score', 'copyright'],
    runningP: ['Chinese', 'English', 'timer', 'score', 'voiceTips', 'visualTips', 'EnglishTips', 'copyright', 'pause'],
    prepareE: ['Chinese', 'timer', 'score', 'copyright'],
    runningE: ['Chinese', 'timer', 'score', 'copyright', 'pause'],
    finishedP: ['gameover', 'timer', 'score', 'gameStat', 'gameStatTitle', 'copyright'],
    finishedE: ['gameover', 'timer', 'score', 'examResultTitle', 'examResult', 'copyright', 'pauseStat'],
    pausing: ['pauseForm', 'timer', 'score'],
    helpPopped: ['helpDetail', 'helpDetailCloser', 'copyright']
}

G.F.controlGobVisibility = function () {
    var nowStageKey;
    for (var key in GameStage) {
        if (GameStage[key] == G.S.gameStage) {
            nowStageKey = key;
            break;
        }
    }
    var visibleGobs = GobVisiblityMapping[nowStageKey];
    for (var gobid in G.O.viewport.CO) {
        var gob = G.O[gobid];
        if (visibleGobs.indexOf(gobid) >= 0) {
            G.F.on(gob);
        } else {
            G.F.off(gob);
        }
    }
}

var allowedKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'SPACE', '-', 'ENTER', '.', "'"];
var specialKeyMapping = {
    '-': String.fromCharCode(189),
    '.': String.fromCharCode(190),
    "'": String.fromCharCode(222)
}

G.F.loadMain = function () { 
    this.AI = G.F.mainAI; 
    
    
    var state = {
        gameStage: GameStage.notReady,
        prevGameStage: null,
        startTime: null,
        audioLocked: false,
        audioPlayerReady: false,
        wordList: [],
        finishedCount: 0,
        wordIndex: null,
        examPrepareLength: 3,
        gameStat: {
            wordCount: 0,
            timeUsed: 0,
            finishedWithoutErrOrTips: 0,
            voiceTipsUsed: 0,
            visualTipsUsed: 0,
            pausedTime: 0,
            pausedTimes: 0
        }
    }
    
    for (var i = 0; i < allowedKeys.length; i++) {
        var key = allowedKeys[i];
        if (specialKeyMapping[key]) {
            key = specialKeyMapping[key];
        }
        G.KB.addKeys(key);
        G.KB.keys[key].setKeyUpEvent(G.F.keyUp);
    }
    
    G.makeGob('viewport', G)
        .setVar({x:50, y:50, w:800, h:600})
        .turnOn();
    
    G.makeGob('pause', G.O.viewport)
        .setVar({x:20, y:20, w:60, h:60, AI: G.F.pauseAI})
        .setSrc('&#9208;')
        .turnOff();
    
    G.makeGob('pauseForm', G.O.viewport)
        .setVar({x:300, y:200, w:200, h:100})
        .turnOff();
        
    G.makeGob('pauseResume', G.O.pauseForm)
        .setVar({x:0, y:15, w:200, h:200, AI: G.F.pauseResumeAI})
        .setSrc('Resume')
        .turnOn();
         
    G.makeGob('pauseQuit', G.O.pauseForm)
        .setVar({x:0, y:55, w:200, h:200, AI: G.F.pauseQuitAI})
        .setSrc('Quit')
        .turnOn();
        
    G.makeGob('pauseStat', G.O.viewport)
        .setVar({x:200, y:50, w:400, h:50})
        .turnOff();
        
    G.makeGob('copyright', G.O.viewport)
        .setVar({x:300, y:560, w:200, h:30})
        .setSrc('© 2022 <a href="https://pandaski.github.io" target="_blank">Pandaski</a>')
        .turnOn();
        
    G.makeGob('Chinese', G.O.viewport)
        .setVar({x:0, y:100, w:800, h:75, AI: G.F.ChineseAI})
        .turnOff();
        
    G.makeGob('voiceTips', G.O.viewport)
        .setSrc('&#128266;')
        .setVar({x:100, y:200, w:60, h:60, AI: G.F.voiceTipsAI})
        .turnOff();
        
    G.makeGob('visualTips', G.O.viewport)
        .setSrc('&#128064;')
        .setVar({x:700, y:200, w:60, h:60, AI: G.F.visualTipsAI})
        .turnOff();
        
    G.makeGob('EnglishTips', G.O.viewport)
        .setSrc('')
        .setVar({x:200, y:200, w:400, h:60})
        .turnOff();
        
    G.makeGob('English', G.O.viewport)
        .setVar({x:0, y:450, w:800, h:100, keyIn: G.F.EnglishKeyIn, submit: G.F.EnglishSubmit})
        .setState({word: '', completed: false, finishedWithoutErrOrTips:true, entered: '', pos:0})
        .turnOff();
        
    G.makeGob('timer', G.O.viewport)
        .setVar({x:350, y:20, w:100, h:50})
        .setSrc('00:00')
        .setState({sec: 0})
        .turnOff();
        
    G.makeGob('score', G.O.viewport)
        .setVar({x:700, y:20, w:100, h:50, AI:G.F.scoreAI})
        .setSrc('0/' + (G.S.wordCount?G.S.wordCount:0))
        .setStyle({color: '#ffffff'})
        .turnOff();
        
    G.makeGob('startParticipate', G.O.viewport)
        .setVar({x:150, y:220, w:500, h:50, AI: G.F.startPAI})
        .setSrc('Participate/练习 - 需要键盘')
        .setState({isRunning: false})
        .turnOff();
        
    G.O.startParticipate.tag.onclick = G.F.initPlayer;
    
    G.makeGob('startExam', G.O.viewport)
        .setVar({x:200, y:320, w:400, h:50, AI: G.F.startEAI})
        .setSrc('Exam/默写 - 需要纸笔')
        .turnOff();
        
    G.O.startExam.tag.onclick = G.F.initPlayer;
    
    G.makeGob('prepareExam', G.O.viewport)
        .setVar({x:200, y:320, w:400, h:50})
        .setSrc('Ready')
        .turnOff();
        
        G.makeGob('gameover', G.O.viewport)
        .setVar({x:0, y:400, w:800, h:100, AI: G.F.gameoverAI})
        .setSrc('Mission Complete!<div class="minior">Click me to play again</div>')
        .turnOff();
    
    G.makeGob('gameStatTitle', G.O.viewport)
        .setVar({x:250, y:100, w:300, h:40})
        .setSrc('Game Stat')
        .turnOff();
    
    G.makeGob('gameStat', G.O.viewport)
        .setVar({x:140, y:140, w:360, h:150})
        .setSrc('')
        .turnOff();

    G.makeGob('examResultTitle', G.O.viewport)
        .setVar({x:250, y:100, w:300, h:40})
        .setSrc('Exam Word List')
        .turnOff();
    
    G.makeGob('examResult', G.O.viewport)
        .setVar({x:100, y:140, w:600, h:250})
        .setStyle({overflow:'auto'})
        .setSrc('')
        .turnOff();
    
    G.makeGob('wordLoader', G.O.viewport)
        .setVar({x:650, y:550, w:150, h:50, AI:G.F.wordLoaderAI})
        .setSrc('Load Words')
        .turnOff();
    
    G.makeGob('wordLoadingForm', G.O.viewport)
        .setVar({x:100, y:20, w:600, h:550})
        .turnOff();
    
    G.makeGob('wordInput', G.O.wordLoadingForm, 'textarea')
        .setVar({x:25, y:90, w:550, h:370})
        .setStyle({overflowY: 'scroll', overflowX: 'auto'})
        .turnOn();
    
    G.makeGob('wordInputTips', G.O.wordLoadingForm)
        .setVar({x:10, y:0, w:550, h:100})
        .setSrc('<ul><li>词语列表内每行有一个中文词和对应的英文单词，用英语竖线（|）分开。</li>' + 
                '<li>必须中文在前英文在后。如：小屋,hut</li>' + 
                '<li>英语单词内只允许出现字母、空格、连字符（-）、点（.）、单引号(\')。</li></ul>')
        .turnOn();
    
    G.makeGob('wordInputError', G.O.wordLoadingForm)
        .setVar({x:25, y:470, w:600, h:40})
        .setSrc('输入的文字不完全符合要求，请检查并修正后再输入')
        .turnOff();
    
    G.makeGob('wordInputOK', G.O.wordLoadingForm)
        .setVar({x:120, y:500, w:100, h:30, AI:G.F.wordInputOKAI})
        .setSrc('OK')
        .turnOn();
    
    G.makeGob('wordInputCancel', G.O.wordLoadingForm)
        .setVar({x:400, y:500, w:100, h:30, AI:G.F.wordInputCancelAI})
        .setSrc('Cancel')
        .turnOn();
    
    G.makeGob('help', G.O.viewport)
        .setVar({x:20, y:550, w:150, h:50, AI: G.F.helpAI})
        .setSrc('Help')
        .turnOff();
    
    G.makeGob('helpDetail', G.O.viewport)
        .setVar({x:100, y:50, w:600, h:500})
        .setSrc('这是一个结合了英语背诵和打字训练的小工具，以下是使用方法。' + 
        '<ol ">' + 
        '<li>用户提前准备一组单词列表，列表内每行有一个中文词和对应的英文单词，用竖线（|）分开。如图所示。注意：必须中文在前英文在后。<br>'+
        '<img width="140px" src="./example.png">' +
        '</li>' +
        '<li>英语单词里可以有字母、空格、连字符（-）、点（.）、单引号(\')，但不能有其他符号。</li>' +
        '<li>点击右下角的“Load Words”加载单词。</li>' +
        '<li>点击游戏中间的“练习”或“默写”开始对应的模式。</li>' +
        '<li>练习模式中工具会打乱单词列表后逐一显示中文词语，并同时朗读英语单词发音*。用户需要在键盘上正确的逐一打出该单词的每个字母和字符（包括空格），直到全部正确输入完成。如果输入字母不正确，工具会通过蜂鸣声提示。</li>' +
        '<li>请注意工具是区分大小写的，例如遇到“Russia”时必须按Shift + r才能正确的输入。</li>' +
        '<li>练习中可以点击🔊或👀图标重听或看正确结果，也可以按回车或点击中文文字跳到下一个词。</li>' +
        '<li>当全部单词都练习完成后，可以选择用同一批单词重新练习，或加载新一批单词。</li>' +
        '<li>默写模式中工具会打乱单词列表后逐一朗读中文词语，用户在纸上默写出正确的单词。</li>' +
        '<li>当全部单词都默写完成后，正确的结果会显示出来以便自我批改。</li>' +
        '</ol>' + 
        '<div>* 本工具使用有道词典网络服务进行发音</div>' 
        )
        .turnOff();
        
    G.makeGob('helpDetailCloser', G.O.viewport)
        .setVar({x:350, y:510, w:100, h:30, AI:G.F.helpCloserAI})
        .setSrc('Close')
        .turnOff();
        
    G.makeGob('audioPlayer', G.O.viewport, 'audio')
        .setVar({AI: G.F.audioAI, play: G.F.playAudio})
        .setState({queue: []})
        .turnOn();
        
    G.makeGob('helpPointer', G.O.viewport)
         .setVar({x:60, y:440, w:150, h:150, AI: G.F.helpPointerAI})
         .setSrc('&#8601;')
        .turnOff();
        
    G.setState(state);
    G.F.loadStoredWordList();
    
};

G.F.mainAI = function () {
    
    var prevGameStage = G.S.gameStage;
    
    G.O.wordLoader.AI();
    G.O.wordInputOK.AI();
    G.O.wordInputCancel.AI();
    
    G.O.startParticipate.AI();
    G.O.startExam.AI();
    G.O.Chinese.AI();
    G.O.voiceTips.AI();
    G.O.visualTips.AI();
    G.O.audioPlayer.AI();
    G.O.gameover.AI();
    G.O.help.AI();
    G.O.helpDetailCloser.AI();
    G.O.helpPointer.AI();
    G.O.pause.AI();
    G.O.pauseResume.AI();
    G.O.pauseQuit.AI();
    
    
    G.F.controlGobVisibility();
    
    // Update status of each child
    if (G.S.gameStage == GameStage.runningP || G.S.gameStage == GameStage.runningE) {
        // timer
        var now = new Date();
        var runInSec = Math.floor((now - G.S.startTime - G.S.gameStat.pausedTime)/1000);
        var runInMin = Math.floor(runInSec / 60);
        runInSec = runInSec % 60;
        
        var str = ((runInMin >= 10 ? '' : '0') + runInMin) + ':' + ((runInSec >= 10 ? '' : '0') + runInSec);
        
        G.O.timer.setSrc(str).draw();
    }
    
    if (G.S.gameStage == GameStage.runningP) {
        // Word
        if (G.O.English.S.completed && !G.S.audioLocked) {
            G.S.wordIndex ++;
            G.S.finishedCount ++;
            
            if (G.O.English.S.finishedWithoutErrOrTips) {
                G.S.gameStat.finishedWithoutErrOrTips += 1;
            }
            
            if (G.S.finishedCount == G.S.wordList.length) {
                G.S.gameStat.timeUsed = Math.floor((now - G.S.startTime - G.S.gameStat.pausedTime)/1000);
                G.S.gameStage = GameStage.finishedP;
            } else {
                G.F.flushWord();
            }
        }
    }
    
    if (G.S.gameStage == GameStage.runningE) {
        var now = new Date();
        if ((G.O.English.S.completed && !G.S.audioLocked) || Math.floor((now - G.O.Chinese.S.startTime - G.S.gameStat.pausedTime) / 1000) >= G.F.getExamSpeed(G.S.wordList[G.S.wordIndex])) {
            G.S.wordIndex ++;
            G.S.finishedCount ++;
            
            if (G.S.finishedCount == G.S.wordList.length) {
                G.S.gameStat.timeUsed = Math.floor((now - G.S.startTime - G.S.gameStat.pausedTime)/1000);
                G.S.gameStage = GameStage.finishedE;
                G.O.audioPlayer.play('static',  'examStop', null, false, true);
            } else {
                G.F.flushWord();
            }
        }
    }
    
    if (G.S.gameStage == GameStage.prepareE) {
        var now = new Date();
        var sec = Math.floor((now - G.S.startExamPrepare) / 1000);
        
        if (sec >= G.S.examPrepareLength) {
            G.O.audioPlayer.play('static',  'examStart', null, false, true);
            G.S.gameStage = GameStage.runningE;
            G.F.startGame();
        }
    }
    
    if (G.S.gameStage != prevGameStage) {
        G.F.gameStageChanged(prevGameStage, G.S.gameStage);
    }
    
    
};

G.F.on = function (gob) {
    if (!gob.on) {
        gob.turnOn();
    }   
}

G.F.off = function (gob) {
    if (gob.on) {
        gob.turnOff();
    }   
}

G.F.voiceTipsAI = function () {
    var t = this;
    if (t.on && !G.S.audioLocked && t.tagContainsMouseClick()) {
        //G.O.English.S.finishedWithoutErrOrTips = false;
        G.O.audioPlayer.play('online', G.O.English.S.word, 'en', false, true);
        G.S.gameStat.voiceTipsUsed += 1;
    }
    return t;
}

G.F.visualTipsAI = function () {
    var t = this;
    if (t.on && t.tagContainsMouseClick()) {
        G.O.English.S.finishedWithoutErrOrTips = false;
        G.O.EnglishTips.setSrc( G.O.English.S.word).draw();
        G.S.gameStat.visualTipsUsed += 1;
    }
    return t;
}

G.F.helpPointerAI = function () {
    var t = this;
    if (t.on) {
        t.setStyle({opacity:Math.abs(Math.cos(G.iteration/12))}).draw();
        if (t.tagContainsMouseClick()) {
            G.S.gameStage = GameStage.helpPopped;
        }
    }
    return t;
}

G.F.startPAI = function () {
    var t = this;
    
    if (t.on) {
        if (G.S.gameStage == GameStage.readyToRun && t.tagContainsMouseClick()) {
            // move game stage to next, init game start time
            G.S.gameStage = GameStage.runningP;
            G.F.startGame();
        }
    }
    
    return t;
}

G.F.startEAI = function () {
    var t = this;
    
    if (t.on) {
        if (G.S.gameStage == GameStage.readyToRun && t.tagContainsMouseClick()) {
            // move game stage to next, init game start time
            G.S.gameStage = GameStage.prepareE;
        }
    }
    
    return t;
}

G.F.gameoverAI = function () {
    var t = this;
    
    if (t.on && t.tagContainsMouseClick()) {
        G.S.gameStage = GameStage.readyToRun;
    }
    
    return t;
}

G.F.helpAI = function () {
    var t = this;
    
    if (t.on) {
        if (t.tagContainsMouseClick()) {
            G.S.gameStage = GameStage.helpPopped;
        }
    }
    
    return t;
}

G.F.helpCloserAI = function () {
    var t = this;
    
    if (t.on) {
        if (t.tagContainsMouseClick()) {
            G.S.gameStage = G.S.prevGameStage;
        }
    }
    
    return t;
}

G.F.ChineseAI = function () {
    var t = this;
    
    if (t.on && !G.S.audioLocked && t.tagContainsMouseClick()) {
        G.O.English.submit();
    }
    
    return t;
}

G.F.flushWord = function () {
    var word = G.S.wordList[G.S.wordIndex];
    G.O.Chinese.setSrc(word.Chinese);
    if (word.Chinese.length > 10) {
        G.O.Chinese.addClass('small');
    } else {
        G.O.Chinese.removeClass('small');
    }
    G.O.Chinese.draw();
    
    G.O.English.S.word = word.English;
    G.O.English.setSrc('').draw();
    G.O.English.S.pos = 0;
    G.O.English.S.completed = false;
    G.O.English.S.finishedWithoutErrOrTips = true;
    G.O.English.S.entered = '';
    
    if (G.S.gameStage == GameStage.runningP) {
        G.O.audioPlayer.play('online', word.English, 'en', false, true);
    } else if (G.S.gameStage == GameStage.runningE) {
        G.O.audioPlayer.play('online', word.Chinese, 'cn', false, true);
        G.O.Chinese.setState({startTime: new Date()})
    }
    
    G.O.score.on && G.O.score.setSrc((G.S.wordIndex + 1)+ '/' + G.S.wordList.length).draw();
}

G.F.keyUp = function() {
    if (G.S.gameStage != GameStage.runningP) {
        return;
    }
    var lastKey = G.KB.lastKey;
    
    if (lastKey.keyStr != 'ENTER') {
        var kin = '';
        if (lastKey.keyStr.length == 1) {
            var specialKey = Object.keys(specialKeyMapping).find(key => specialKeyMapping[key] === lastKey.keyStr);
            if (specialKey) {
                lastKey.keyStr = specialKey;
            }
            
            if (lastKey.shiftKey) {
                kin = lastKey.keyStr;
            } else {
                kin = lastKey.keyStr.toLowerCase();
            }
        } else {
            kin = ' ';
        }
        
        G.O.English.keyIn(kin);
    }
    else {
        G.O.English.submit(kin);
    }
}

G.F.EnglishKeyIn = function (kin) {
    var t = this;
    
    if (G.S.audioLocked) {
        return t;
    }
    G.O.EnglishTips.setSrc('').draw();
    if (t.S.word[t.S.pos] == kin) {
        t.S.entered += kin;
        t.S.pos += 1;
        t.setSrc(G.O.English.S.entered.replace(/ /g, '&nbsp;')).draw();
        
        if (kin.match(/[A-Z]/i)) {
            G.O.audioPlayer.play('static', kin, null, true, t.S.entered == t.S.word);
        }
    } else {
        G.O.English.S.finishedWithoutErrOrTips = false;
        G.O.audioPlayer.play('static', 'beep', null, true, false);
    }
    
    if (t.S.entered == t.S.word) {
        G.O.audioPlayer.play('online', t.S.word, 'en', false, true);
        t.S.completed = true;
        t.submit();
    }
    
    return t;
}

G.F.EnglishSubmit = function () {
    var t = this;
    G.O.EnglishTips.setSrc('').draw();
    t.S.completed = true;
    if (t.S.entered != t.S.word) {
        t.S.finishedWithoutErrOrTips = false;
    }
    return t;
}

G.F.releaseAudioLock = function () {
    G.S.audioLocked = false;
}
G.F.releaseAudioLockError = function () {
    console.log('Error on playing ' + this.src);
    G.S.audioLocked = false;
}

G.F.releaseAudioLockAbort = function () {
    //    G.S.audioLocked = false;
}

G.F.audioAI = function() {
    var t = this;

    if (G.S.audioLocked) {
        return t;
    }
    
    if (t.S.queue.length == 0) {
        return t;
    }
    
    var o = t.S.queue[0];
    if (!t.tag.ended && !o.playNow) {
        return t;
    }
    t.S.queue.shift();
    var audioSrc = '';
    if (o.type == 'static' && o.content) {
        if (resources.audio[o.content.toUpperCase()]) {
           audioSrc = 'data:audio/mp3;base64,' + resources.audio[o.content.toUpperCase()];
        } else {
           audioSrc = './audio/' + o.content.toUpperCase() + '.mp3';
       }
    } else if (o.type == 'online' && o.content) {
        audioSrc = 'http://tts.youdao.com/fanyivoice?le=' + o.language +'&word=' + o.content;
    }
    
    if (audioSrc != '') {
        t.tag.src = audioSrc;
        if (o.audioLock) {
            G.S.audioLocked = true;
            t.tag.onabort = G.F.releaseAudioLockAbort; 
            t.tag.onended = G.F.releaseAudioLock; 
        } else {
            t.tag.onabort = function () {return false}; 
            t.tag.onended = function () {return false}; 
        }
        t.tag.play();
    }
       
    return t;
}

G.F.playAudio = function (type, content, language, playNow, audioLock) {
    var t = this;
    
    var o = {type: type, content: content, language:language, playNow: playNow, audioLock: audioLock};
    if (playNow) {
        t.S.queue = [o];
    } else {
        t.S.queue.push(o);
    }
    
    return t;
}

G.F.initPlayer = function () {
    if (!G.S.audioPlayerReady) {
        var t = document.getElementById('audioPlayer');
        t.onerror = G.F.releaseAudioLockError;
        t.src = 'data:audio/mp3;base64,' + resources.audio.BLANK;
//        t.src = './audio/blank.mp3';      
        t.play();   
        
       G.S.audioPlayerReady = true; 
    }
}

G.F.wordLoaderAI = function() {
    var t = this;
    
    if (t.on && t.tagContainsMouseClick()) {
        G.S.gameStage = GameStage.loadingWordList;
        
        G.O.wordInputError.turnOff();
        var text = G.F.arrayToText(G.S.wordList);
        G.O.wordInput.tag.value=text;
    }
    
    return t;
}

G.F.textToArray = function(text) {
    var rows = text.trim().split('\n');
    var arr = [];
    for (var i=0; i<rows.length; i++) {
        var row = rows[i];
        if (row.indexOf('|') >= 0) {
            var values = row.split('|');
            arr.push({
                Chinese: values[0].trim(),
                English: values[1].trim()
            }); 
        }
    }  
    return arr;
}

G.F.arrayToText = function(arr) {
    var text = '';
    for (var i=0; i<arr.length; i++) {
        var o = arr[i];
        text += o.Chinese + '|' + o.English;
        if (i < arr.length-1) {
            text += '\n';
        }
    }  
    return text;
}

G.F.validateWordInputText = function (text) {
    var rows = text.trim().split('\n');
    var arr = [];
    var passed = true;
    var hasNotEmptyRow = false;
    for (var i=0; i<rows.length; i++) {
        var row = rows[i].trim();
        if (row.length == 0) {
            continue;
        }
        hasNotEmptyRow = true;
        if (row.indexOf('|') < 0 || row.split('|')[1].trim().match(/^[\.\' \-a-zA-Z]+$/) == null) {
            passed = false;
            break;
        }
    }  
    
    return passed && hasNotEmptyRow;
}


G.F.loadWordList = function () {
    var wordInput = G.O.wordInput.tag;
    try {
        var inputed = wordInput.value.trim();
        if (!G.F.validateWordInputText(inputed)) {
            G.O.wordInputError.turnOn();
        } else {
            G.O.wordInputError.turnOff();
            var wordList = G.F.textToArray(wordInput.value.trim());
                
            localStorage.setItem('wordList', JSON.stringify(wordList));
            G.setState({wordList: wordList,
                wordCount: wordList.length,
                gameStage: GameStage.readyToRun
            });
            G.O.score.setSrc('0/' + G.S.wordList.length).draw();
        }
        
    } catch (error) {
        console.log(error);
    }
}

G.F.loadStoredWordList = function () {
    if (localStorage.getItem('wordList')) {
        var wordList = JSON.parse(localStorage.getItem('wordList'));
        
        G.setState({wordList: wordList,
            wordCount: wordList.length,
            wordsLoaded: true,
            gameStage: GameStage.readyToRun
        });
        G.O.score.setSrc('0/' + G.S.wordList.length).draw();
    }
}

G.F.wordInputCancelAI = function () {
    var t = this;    
    if (t.on && !G.S.audioLocked && t.tagContainsMouseClick()) { 
              
        G.S.gameStage = G.S.prevGameStage;
    }
    
    return t;
}

G.F.wordInputOKAI = function () {
    var t = this;    
    if (t.on && !G.S.audioLocked && t.tagContainsMouseClick()) { 
        G.F.loadWordList();
        
    }
    
    return t;
}

G.F.gameStageChanged = function (prevGameStage, nowGameStage) {
    G.S.prevGameStage = prevGameStage;
    if (prevGameStage == GameStage.readyToRun && nowGameStage == GameStage.running) {
    }   
    
    if (nowGameStage == GameStage.readyToRun) {
        G.S.finishedCount = 0;
        G.O.timer.setSrc('00:00').draw();
        G.O.score.setSrc('0/' + G.S.wordList.length).draw();
        G.S.gameStat.pausedTime = 0;
    }
    
    if (nowGameStage == GameStage.finishedP) {
        var buildRow = function(key, value) {
            return '<div class="row"><div class="left">' + key + '</div><div class="right">' + value + '</div></div>';
        }
        var gameStatSrc = "";
        gameStatSrc += buildRow('Number of Words', G.S.gameStat.wordCount);
        gameStatSrc += buildRow('Time Used', Math.floor(G.S.gameStat.timeUsed/60) + "' " + (G.S.gameStat.timeUsed % 60) + '"');
        gameStatSrc += buildRow('Finished without Error or Tips', G.S.gameStat.finishedWithoutErrOrTips);
        gameStatSrc += buildRow('Tips Used', G.S.gameStat.visualTipsUsed);
        
        G.O.gameStat.setSrc(gameStatSrc).draw();
    }
    
    if (nowGameStage == GameStage.finishedE) {
        var buildRow = function(key, value) {
            return '<div class="row"><div class="left">' + key + '</div><div class="right">' + value + '</div></div>';
        }
        var examResultSrc = "";
        for (var i=0; i<G.S.wordList.length; i++) {
            examResultSrc += buildRow(G.S.wordList[i].Chinese, G.S.wordList[i].English);
        }
        
        G.O.examResult.setSrc('<div class="content">' + examResultSrc + '</div>').draw();
        
        if (G.S.gameStat.pausedTimes > 0) {
            var pausedTimeSec = Math.ceil(G.S.gameStat.pausedTime/1000);
            var pausedTimeStr = Math.floor(pausedTimeSec/60) + "' " + (pausedTimeSec % 60) + '"'
            var pauseStatStr = 'Paused ' + G.S.gameStat.pausedTimes + ' times for ' + pausedTimeStr;
            G.O.pauseStat.setSrc(pauseStatStr);
        } else {
            G.O.pauseStat.setSrc('');
        }
    }
    
    if (nowGameStage == GameStage.prepareE) {
        var now = new Date();
        G.setState({'startExamPrepare': now});
        G.O.Chinese.setSrc('').draw();
        G.O.audioPlayer.play('static', 'examPrepare', null, true, true);
    }
    
    if (nowGameStage == GameStage.pausing) {
        var now = new Date();
        G.S.pauseStart = now;
    }

}


G.F.startGame = function (){
    G.S.startTime = new Date();
    
    G.S.wordList = G.S.wordList.sort(() => Math.random() - 0.5);
    G.S.wordCount = G.S.wordList.length;
    G.S.finishedCount = 0;
    G.S.wordIndex = 0;
    
    G.S.gameStat = {
        wordCount: G.S.wordCount,
        timeUsed: 0,
        finishedWithoutErrOrTips: 0,
        voiceTipsUsed: 0,
        visualTipsUsed: 0,
        pausedTime: 0,
        pausedTimes: 0
    }
    
    G.F.flushWord();  
    
}

G.F.pauseAI = function () {
    var t = this;
    
    if (t.on && !G.S.audioLocked && t.tagContainsMouseClick()) {        
        G.S.gameStage = GameStage.pausing;
        G.S.gameStat.pausedTimes += 1;
    }
    
    return t;
}

G.F.pauseResumeAI = function () {
    var t = this;    
    if (t.on && !G.S.audioLocked && t.tagContainsMouseClick()) { 
        console.log(G.S.prevGameStage)       
        G.S.gameStage = G.S.prevGameStage;
        var now = new Date();
        G.S.gameStat.pausedTime += now - G.S.pauseStart;
        
    }
    
    return t;
}

G.F.pauseQuitAI = function () {
    var t = this;    
    if (t.on && !G.S.audioLocked && t.tagContainsMouseClick()) {        
        G.S.gameStage = GameStage.readyToRun;
    }
    
    return t;
}

G.makeBlock('main', G.F.loadMain).loadBlock('main'); 
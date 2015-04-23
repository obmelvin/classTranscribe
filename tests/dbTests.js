var chai  = require('chai');
var mocha = require('mocha');
var expect = chai.expect;
var should = chai.should;
var server = require('./../server.js');

describe('/api/loadAnnotations', function() {
    context('when annotations exist', function() {
        it('should retrieve all annotations for that video', function(done) {
            var videoName = 'Mini Video: Hello World';
            var annotations = [ {
                                    id: 3,
                                    userID: 2,
                                    time: 0,
                                    video: videoName,
                                    content: 'pleasseee' },
                                {
                                    id: 4,
                                    userID: 2,
                                    time: 19,
                                    video: videoName,
                                    content: 'learn more at http://linux.die.net/man/2/write' },
                                {
                                    content: "test",
                                    id: 5,
                                    time: 8,
                                    userID: 2,
                                    video: "Mini Video: Hello World"
                                }];
            server.loadAnnotations(videoName, function(error, results) {
                annotations.forEach(function(annotation) {
                    expect(results).to.contain(annotation);
                });
                done();
            })
        })
    })

});

describe('/api/suggestTranscriptionChanges', function() {
    context('when submitting a change', function() {
        it('should be added to the DB', function(done) {
            var videoName = 'Mini Video: Hello World';
            var suggestion = "so here's a virtual machine";
            server.suggestTranscriptionChange(2, videoName, 11, suggestion, function(error, results) {
                expect(results).to.have.property('insertId');
                expect(results.insertID).not.to.be.null;
                done();
            })
        })
    })
});

describe('/api/loadComments', function() {
    context('when getting Hello World video\'s comments', function() {
        it('should have at least these comments', function(done) {
            var videoName = 'Mini Video: Hello World';
            var comment1 = {"_id":"5538434c25c489390bc35324",
                            "authorID":9,
                            "commentID":11,
                            "parentID":0,
                            "video":"Mini Video: Hello World",
                            "body":"hello, world",
                            "__v":0};
            var comment2 = {"_id":"55384433827596410b7dd585",
                            "authorID":9,
                            "commentID":12,
                            "parentID":0,
                            "video":"Mini Video: Hello World",
                            "body":"hey, I just met you",
                            "__v":0};
            server.loadComments(videoName, function(error, results) {
                expect(results).to.contain(comment1);
                expect(results).to.contain(comment2);
                done();
            })
        })
    })
})



//describe('when new comment', function() {
//    //before(function() {
//    //    server.startServer();
//    //});
//    context('contains a blacklisted word', function() {
//        it('should be filtered', function() {
//            expect(server.filterComment('Justin Bieber is an ass')).to.equal('He Who Must Not Be Named is an apple');
//        });
//    });
//    context('doesn\'t contain a blacklisted word', function() {
//        it('nothing should be touched', function() {
//            var comment = 'hello, here is a test comment';
//            expect(server.filterComment(comment)).to.equal(comment);
//        });
//    })
//});

//describe('#indexOf()', function(){
//    context('when not present', function(){
//        it('should not throw an error', function(){
//            (function(){
//                [1,2,3].indexOf(4);
//            }).should.not.throw();
//        });
//        it('should return -1', function(){
//            [1,2,3].indexOf(4).should.equal(-1);
//        });
//    });
//    context('when present', function(){
//        it('should return the index where the element first appears in the array', function(){
//            [1,2,3].indexOf(3).should.equal(2);
//        });
//    });
//});
//});
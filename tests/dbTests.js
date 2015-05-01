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
    });
    context('when there are no annotations', function() {
        it('should return an empty array without throwing an error', function(done) {
            var videoName = 'Mini Video: ';
            var annotations = [];
            server.loadAnnotations(videoName, function(error, results) {
                expect(results).to.equal(annotations);
                done();
            })
        })
    });
});

describe('/api/addAnnotation', function() {
    context('when a user has permission to add an annotation', function() {
        it('the api call should return', function(done) {
            var userID = 9; // omelvin2@illinois.edu
            var video = 'Mini Video: Hello World';
            var time = 8;
            var content = "I meant to say execv";
            var expectedResult = true;
            server.addAnnotations(userID, video, time, content, function(error, result) {
                //TODO: what does MYSQL set results to be?
                expect(result).to.equal(expectedResult);
                done();
            });
        });

    });
    context('when a user doesn\'t have permission to add an annotation', function() {
        it('the api call should fail with status code 507', function(done) {
            //TODO: use the actual route instead of associated logic method OR test fail in a way that doesn't require HTTP status code
            var userID = 2; // obmelvin@gmail.com
            var video = 'Mini Video: Hello World';
            var time = 8;
            var content = "I meant to say execv";
            var expectedResult = null;
            server.addAnnotations(userID, video, time, content, function(error, result) {
                //TODO: what does MYSQL set results to be?
                expect(result).to.equal(expectedResult);
                done();
            });
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

describe('/api/getComments', function() {
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
});

describe('/api/addComments', function() {
    context('when adding a top level comment', function(done) {
        it('it should be the to comment', function() {
            var parentID = 0;
            var author = 2;
            var video = 'Mini Video: Hello World';
            var body = 'unit test comment';
            server.submitComment(parentID, author, video, body, function(error, results) {
                expect(results[0]["parentID"]).to.equal(parentID);
                expect(results[0]["authorID"]).to.equal(author);
                expect(results[0]["video"]).to.equal(video);
                expect(results[0]["body"]).to.equal(body);
                done();
            })
        })
    });
    context('when adding a comment reply', function(done) {
        it('should have the correct parentID', function() {
            var parentID = 5;
            var author = 2;
            var video = 'Mini Video: Hello World';
            var body = 'unit test comment';
            server.submitComment(parentID, author, video, body, function(error, results) {
                var index = 5; //what will the index be??
                expect(results[index]["parentID"]).to.equal(parentID);
                expect(results[index]["authorID"]).to.equal(author);
                expect(results[index]["video"]).to.equal(video);
                expect(results[index]["body"]).to.equal(body);
                done();
            })
        });
    })
});

describe('api/addCommentVote', function() {
    context('when upvoting a comment the user hasn\'t previously voted on', function(done) {
        it('the comment score should increase by one', function() {
            var commentID = 5;
            var userID = 2;
            server.getCommentScore(commentID, function(error, result) {
                var oldScore = result["score"];
                server.submitCommentVote(commentID, userID, true, function(error, result) {
                    if(!error) {
                        server.getCommentScore(commentID, function(error, result) {
                            expect(result["score"]).to.equal(oldScore+1);
                        })
                    }

                })
            })

        })
    });
    context('when downvoting a comment the user hasn\'t previously voted on', function(done) {
        it('the comment score should increase by one', function() {
            var commentID = 5;
            var userID = 2;
            server.getCommentScore(commentID, function(error, result) {
                var oldScore = result["score"];
                server.submitCommentVote(commentID, userID, false, function(error, result) {
                    if(!error) {
                        server.getCommentScore(commentID, function(error, result) {
                            expect(result["score"]).to.equal(oldScore-1);
                        })
                    }

                })
            })

        })
    });
    context('when upvoting a comment the user has previously downvoted', function(done) {
        it('the comment score should increase by one', function() {
            var commentID = 5;
            var userID = 2;
            server.getCommentScore(commentID, function(error, result) {
                var oldScore = result["score"];
                server.submitCommentVote(commentID, userID, true, function(error, result) {
                    if(!error) {
                        server.getCommentScore(commentID, function(error, result) {
                            expect(result["score"]).to.equal(oldScore+2);
                        })
                    }

                })
            })

        })
    });
    context('when downvoting a comment the user has previously upvoted', function(done) {
        it('the comment score should increase by one', function() {
            var commentID = 5;
            var userID = 2;
            server.getCommentScore(commentID, function(error, result) {
                var oldScore = result["score"];
                server.submitCommentVote(commentID, userID, false, function(error, result) {
                    if(!error) {
                        server.getCommentScore(commentID, function(error, result) {
                            expect(result["score"]).to.equal(oldScore-2);
                        })
                    }

                })
            })

        })
    });
});
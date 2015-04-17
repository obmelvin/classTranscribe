var chai  = require('chai');
var mocha = require('mocha');
var expect = chai.expect;
var should = chai.should;
var server = require('./../server.js');

describe('/api/loadAnnotations', function() {
    context('when annotations exist', function() {
        it('should retrieve all annotations for that video', function() {
            var videoName = 'Mini Video: Hello World';
            var annotations = [ {
                                    id: 3,
                                    userID: 2,
                                    video: videoName,
                                    content: 'pleasseee' },
                                {
                                    id: 4,
                                    userID: 2,
                                    video: videoName,
                                    content: 'learn more at http://linux.die.net/man/2/write' } ];
            server.loadAnnotations(videoName, function(error, results) {
                expect(results).to.equal(annotations);
            })
        })
    })
});

describe('/api/suggestTranscriptionChanges', function() {
    context('when submitting a change', function() {
        it('should be added to the DB', function() {
            var videoName = 'Mini Video: Hello World';
            var suggestion = "so here's a virtual machine";
            server.suggestTranscriptionChange(2, videoName, 11, suggestion, function(error, results) {
                expect(results).to.have.property('insertId');
                expect(results.insertID).not.to.be.null;
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
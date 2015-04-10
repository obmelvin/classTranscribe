var reverseIndex = Object.create(null);

function createReverseIndex() {
  videoCaptions.forEach(function (captions, i) {
    var currentTime = 0;
    var prevWord = "";
    var prevprevWord = "";
    captions.forEach(function (caption) {
      caption.text.split(/\s+/).forEach(function (word) {
        word = word.replace(/[\W_]+/g,"").toLowerCase(); // Remove all non-alphanumeric characters
        if (word) {
          reverseIndex[word] = (reverseIndex[word] || []);
          reverseIndex[word].push({
            videoIndex: i,
            startTime: currentTime,
            snippet: caption.text
          });
          if (prevWord.length) {
            reverseIndex[prevWord + " " + word] = (reverseIndex[prevWord + " " + word] || []);
            reverseIndex[prevWord + " " + word].push({
              videoIndex: i,
              startTime: currentTime,
              snippet: caption.text
            });
            if (prevprevWord.length) {
              reverseIndex[prevprevWord + " " + prevWord + " " + word] = (reverseIndex[prevprevWord + " " + prevWord + " " + word] || []);
              reverseIndex[prevprevWord + " " + prevWord + " " + word].push({
                videoIndex: i,
                startTime: currentTime,
                snippet: caption.text
              });
            }
            prevprevWord = prevWord;
          }
          prevWord = word;
        }
      })
      prevWord = "";
      currentTime += (caption.width / 64) + (2/64);
    })
  })
}

a = new Date()
createReverseIndex();
console.log (new Date() - a);

$(document).ready(function () {
  bindEventListeners();
  $(".search-box").focus();
});

/*
  Binds event listeners on input elements
*/
function bindEventListeners() {
  $(".search-box").off().keyup(inputKeypress);

  $("#showLoginButton").click(showLogin);
  $("#showSignUpButton").click(showSignUp);
  $("#loginForm").submit(login);
  $("#signUpForm").submit(signUp);
}

function showLogin() {
  $("#showLoginButton").hide();
  $("#showSignUpButton").hide();
  $("#loginForm").show();
}

function login(event) {
  event.preventDefault();
  var email = $("#emailLogin").val();
  var password = $("#passwordLogin").val();
  $.post('/login', {'email': email, 'password': password}, function(data) {
    user = JSON.parse(data);
    if(user.userID) {
      $('#loginForm').hide();
      var welcomeHTML = '<p>Welcome ' + user.email + '</p>';
      if(user.userType === 1) {
        welcomeHTML += '<a href="/annotations">Add annotations</a>';
      }
      $("#welcome").html(welcomeHTML);
    }
  })
}

function showSignUp() {
  $("#showLoginButton").hide();
  $("#showSignUpButton").hide();
  $("#signUpForm").show();
}

function signUp(event) {
  event.preventDefault();
  var email = $("#emailSignUp").val();
  var password = $("#passwordSignUp").val();
  $.post('/signup', {'email': email, 'password': password}, function(data) {
    console.log(data);
  })
}

/*
  Captures the input keypresses and reacts accordingly
*/
function inputKeypress(e) {
  $(".search-results-container").empty()
  var query = $(".search-box").val().toLowerCase();
  var re = new RegExp("(^|\s)(" + query + ")(\s|$)","g");
  query = query.trim().replace(/[^a-zA-Z\d\s:]+/g,""); // Remove all non-alphanumeric characters
  var results = Object.create(null);
  if (reverseIndex[query]) {
    reverseIndex[query].forEach(function (match) {
      if (!results[match.snippet]) {
        var snippet = match.snippet;
        query.split(/\s+/).forEach(function (word) {
          snippet = updateHaystack(snippet, word);
        });
        var template = '<div><a href="/viewer.html?videoIndex=' + match.videoIndex + '&startTime=' + match.startTime + '">' + snippet + '</a></div>';
        $(".search-results-container").append(template);
        results[match.snippet] = true;
      }
    });
  }
  var prevWord = "";
  var prevprevWord = "";
  query.trim().split(/\s+/).forEach(function (word) {
    if (reverseIndex[word]) {
      if (prevWord && reverseIndex[prevWord + " " + word]) {
        if (prevprevWord && reverseIndex[prevprevWord + " " + prevWord + " " + word]) {
          reverseIndex[prevprevWord + " " + prevWord + " " + word].forEach(function (match) {
            if (!results[match.snippet]) {
              var snippet = match.snippet;
              query.split(/\s+/).forEach(function (word) {
                snippet = updateHaystack(snippet, word);
              });
              var template = '<div><a href="/viewer.html?videoIndex=' + match.videoIndex + '&startTime=' + match.startTime + '">' + snippet + '</a></div>';
              $(".search-results-container").append(template);
              results[match.snippet] = true;
            }
          });
        }
        reverseIndex[prevWord + " " + word].forEach(function (match) {
          if (!results[match.snippet]) {
            var snippet = match.snippet;
            query.split(/\s+/).forEach(function (word) {
              snippet = updateHaystack(snippet, word);
            });
            var template = '<div><a href="/viewer.html?videoIndex=' + match.videoIndex + '&startTime=' + match.startTime + '">' + snippet + '</a></div>';
            $(".search-results-container").append(template);
            results[match.snippet] = true;
          }
        });
        prevprevWord = prevWord
      }
      reverseIndex[word].forEach(function (match) {
        if (!results[match.snippet]) {
          var snippet = match.snippet;
          query.split(/\s+/).forEach(function (word) {
            snippet = updateHaystack(snippet, word);
          });
          var template = '<div><a href="/viewer.html?videoIndex=' + match.videoIndex + '&startTime=' + match.startTime + '">' + snippet + '</a></div>';
          $(".search-results-container").append(template);
          results[match.snippet] = true;
        }
      });
      prevWord = word;
    }
  });
}

/*
  Bolds a needle in the input
*/
function updateHaystack(input, needle) {
  return input.replace(new RegExp('(^|[^a-zA-Z\d\s:])(' + escapeRegExp(needle) + ')([^a-zA-Z\d\s:]|$)','ig'), '$1<b>$2</b>$3');
}

/*
  Escapes a regular expression string
*/
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
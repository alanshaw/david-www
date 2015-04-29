var rewire = require("rewire")
var nsp = rewire("../lib/nsp")

function mockGithub (contents) {
  return {
    getInstance: function () {
      return {
        repos: {
          getContent: function (opts, cb) {
            process.nextTick(function () {
              cb(null, contents)
            })
          }
        }
      }
    }
  }
}

module.exports = {
  "NSP update advisories works good": function (test) {
    nsp.__set__("github", mockGithub([
      {name: "Hubot_Potential_command_injection_in_email.coffee.md"},
      {name: "JS-YAML_Deserialization_Code_Execution.md"},
      {name: "Tomato_API_Admin_Auth_Weakness.md"}
    ]))

    nsp.updateAdvisories(function (er, advisories) {
      test.ifError(er)
      test.ok(advisories["hubot-scripts"])
      test.equal(advisories["hubot-scripts"].length, 1)
      test.ok(advisories["js-yaml"])
      test.equal(advisories["js-yaml"].length, 1)
      test.ok(advisories.tomato)
      test.equal(advisories.tomato.length, 1)
      test.done()
    })
  }
}
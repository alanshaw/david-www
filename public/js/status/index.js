/* jshint browser:true, jquery:true */

var d3 = require("d3")
var merge = require("merge")
var Handlebars = require("handlebars")
var fs = require("fs")
var cycle = require("cycle")
var david = require("../david")
var transformData = require("./transform-data")
var graph = require("./graph")

require("../vendor/stackable")
require("../vendor/jquery.fancybox.js")
require("../vendor/jquery.ba-bbq.js")
require("../vendor/jquery.ba-hashchange.js")

var embedTmpl = Handlebars.compile(fs.readFileSync(__dirname + "/../../../dist/inc/embed-badge.html", {encoding: "utf8"}))
var embedTmplType = Handlebars.compile(fs.readFileSync(__dirname + "/../../../dist/inc/embed-badge-type.html", {encoding: "utf8"}))

$("#status-page").each(function () {

  var state = {
    info: $.bbq.getState("info", true) || "dependencies",
    view: $.bbq.getState("view", true) || "table"
  }

  // Normalized pathname for use with XHR requests
  var pathname = window.location.pathname

  if (pathname[pathname.length - 1] !== "/") {
    pathname += "/"
  }

  function initInfo (container, graphJsonUrl) {
    graphJsonUrl = graphJsonUrl || "graph.json"

    $(".dep-table table", container).stacktable()

    // Load the graph data and render when change view
    var graphLoaded = false
      , graphContainer = $(".dep-graph", container)
      , tableContainer = $(".dep-table", container)

    graphContainer.hide()

    function initGraph () {
      var loading = david.createLoadingEl()
      graphContainer.prepend(loading)

      d3.json(pathname + graphJsonUrl, function (er, json) {
        if (er) return loading.empty().text("Error occurred retrieving graph data")

        transformData(cycle.retrocycle(json), function (er, root) {
          var vis = graph.create(container)
          // Initialize the display to show a few nodes.
          root.children.forEach(graph.toggleChildren)
          graph.update(vis, root)
          loading.remove()
        })
      })
    }

    var viewSwitchers = $(".switch a", container)

    viewSwitchers.click(function (e) {
      e.preventDefault()
      merge(state, $.deparam.fragment($(this).attr("href")))
      $.bbq.pushState(state)
    })

    function onHashChange () {
      merge(state, $.bbq.getState())

      viewSwitchers.removeClass("selected")

      if (state.view != "tree") {
        graphContainer.hide()
        tableContainer.fadeIn()
        viewSwitchers.first().addClass("selected")
      } else {
        tableContainer.hide()
        graphContainer.fadeIn()
        viewSwitchers.last().addClass("selected")

        if (!graphLoaded) {
          graphLoaded = true
          initGraph()
        }
      }
    }

    /* Init changes links */

    $(".changes-icon", container).click(function (e) {
      e.preventDefault()

      var row = $(this).closest("tr")
        , container = $("<div class=\"changes-popup\"/>").append(david.createLoadingEl())
        , name, from, to

      if (row.closest("table").is(".stacktable")) {
        name = $("a:first-child", row).text()
        from = $(".st-val", row.next()).text()
        to = $(".st-val", row.next().next()).text()
      } else {
        name = $(".dep > a:first-child", row).text()
        from = $(".required", row).text()
        to = $(".stable", row).text()
      }

      $.fancybox.open(container)

      $.ajax({
        url: "/package/" + name + "/changes.json",
        dataType: "json",
        data: {from: from, to: to},
        success: function (data) {
          data.from = from
          data.to = to

          var tpl = fs.readFileSync(__dirname + "/../../../dist/inc/changes.html", {encoding: "utf8"})
          container.html(Handlebars.compile(tpl)(data))
          $.fancybox.update()
        },
        error: function () {
          container.html(fs.readFileSync(__dirname + "/../../../dist/inc/changelog-er.html", {encoding: "utf8"}))
          $.fancybox.update()
        }
      })
    })

    $(window).bind("hashchange", onHashChange)

    onHashChange()
  }

  var badges = $(".badge")
    , depInfoLoaded = {}
    , depInfos = $(".dep-info")
    , depSwitchers = $("#dep-switch a")
    , repo = $("#repo")

  badges.click(function () {
    if (!$($(this).attr("href")).size()) {
      var data = {type: $(this).data("type"), user: repo.data("user"), repo: repo.data("repo"), ref: repo.data("ref")}
      var ct = $(data.type ? embedTmplType(data) : embedTmpl(data))

      $("input", ct).each(function () {
        var clicked = false
          , embedCode = $(this)

        embedCode.click(function () {
          if (!clicked) {
            embedCode.select()
            clicked = true
          }
        })
      })

      $("select", ct).change(function () {
        $(".theme", ct).hide()
        $(".theme-" + $(this).val(), ct).show()
      })

      $(".theme", ct).not(".theme-svg").hide()

      repo.append(ct)
    }
  })

  badges.fancybox()

  depSwitchers.click(function (e) {
    e.preventDefault()
    merge(state, $.deparam.fragment($(this).attr("href")))
    $.bbq.pushState(state)
  })

  // Hash change for info switch
  function onHashChange () {
    merge(state, $.bbq.getState())
    depSwitchers.removeClass("selected")

    var badge, depInfo

    if (!state.info || state.info == "dependencies") {
      badge = badges.first()
      depInfo = depInfos.first()
      depSwitchers.filter("[href='#info=dependencies']").addClass("selected")
    } else {
      var type = state.info.replace("Dependencies", "")

      badge = $("#" + type + "-status")
      depInfo = $("#" + type + "-dep-info")
      depSwitchers.filter("[href='#info=" + type + "Dependencies']").addClass("selected")

      if (!depInfoLoaded[type]) {
        depInfoLoaded[type] = true

        var loading = david.createLoadingEl()

        depInfo.prepend(loading)

        $.getJSON(pathname + type + "-info.json", function (data) {
          var tpl = fs.readFileSync(__dirname + "/../../../dist/inc/info.html", {encoding: "utf8"})
          loading.remove()
          depInfo.html(Handlebars.compile(tpl)({ info: data }))
          initInfo(depInfo, type + "-graph.json")
        })
      }
    }

    depInfos.not(depInfo).hide()
    depInfo.fadeIn()

    badges.not(badge).hide()
    badge.show()
  }

  $(window).bind("hashchange", onHashChange)

  onHashChange()
  initInfo(depInfos.first())
})

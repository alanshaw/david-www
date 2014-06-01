/* jshint browser:true, jquery:true */

var d3 = require("d3")
  , merge = require("merge")
  , Handlebars = require("handlebars")
  , fs = require("fs")
  , cycle = require("cycle")
  , david = require("../david")
  , transformData = require("./transform-data")
  , graph = require("./graph")

require("../vendor/stackable")
require("../vendor/jquery.fancybox.js")
require("../vendor/jquery.ba-bbq.js")
require("../vendor/jquery.ba-hashchange.js")

$("#status-page").each(function () {
  var status = $("#status")
  status.fancybox()

  var devStatus = $("#dev-status")
  devStatus.fancybox()

  $(".badge-embed input").each(function () {
    var clicked = false
      , embedCode = $(this)

    embedCode.click(function () {
      if (!clicked) {
        embedCode.select()
        clicked = true
      }
    })
  })

  $(".badge-embed select").change(function () {
    var container = $(this).closest(".badge-embed")
    $(".theme", container).hide()
    $(".theme-" + $(this).val(), container).show()
  })

  $(".badge-embed .theme").not(".theme-svg").hide()

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

    $(".changes", container).click(function (e) {
      e.preventDefault()

      var row = $(this).closest("tr")
        , container = $("<div class=\"changes-popup\"/>").append(david.createLoadingEl())
        , name, from, to

      if (row.closest("table").is(".stacktable")) {
        name = $("a:first-child", row).text()
        from = $(".st-val", row.next()).text()
        to = $(".st-val", row.next().next()).text()
      } else {
        name = $(".dep a:first-child", row).text()
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

  var devDepInfoLoaded = false
    , depInfoContainer = $("#dep-info")
    , devDepInfoContainer = $("#dev-dep-info")

  devDepInfoContainer.hide()

  var depSwitchers = $("#dep-switch a")

  depSwitchers.click(function (e) {
    e.preventDefault()
    merge(state, $.deparam.fragment($(this).attr("href")))
    $.bbq.pushState(state)
  })

  // Hash change for info switch
  function onHashChange () {
    merge(state, $.bbq.getState())

    depSwitchers.removeClass("selected")

    if (state.info != "devDependencies") {
      devDepInfoContainer.hide()
      depInfoContainer.fadeIn()
      status.show()
      devStatus.hide()
      depSwitchers.first().addClass("selected")
    } else {
      depInfoContainer.hide()
      devDepInfoContainer.fadeIn()
      status.hide()
      devStatus.show()
      depSwitchers.last().addClass("selected")

      if (!devDepInfoLoaded) {
        devDepInfoLoaded = true

        var loading = david.createLoadingEl()

        devDepInfoContainer.prepend(loading)

        $.getJSON(pathname + "dev-info.json", function (data) {
          var tpl = fs.readFileSync(__dirname + "/../../../dist/inc/info.html", {encoding: "utf8"})
          loading.remove()
          devDepInfoContainer.html(Handlebars.compile(tpl)({ info: data }))
          initInfo(devDepInfoContainer, "dev-graph.json")
        })
      }
    }
  }

  $(window).bind("hashchange", onHashChange)

  onHashChange()
  initInfo(depInfoContainer)
})

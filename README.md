[![David](https://raw.github.com/alanshaw/david-www/master/david.png)](https://david-dm.org/)

[![Build Status](https://travis-ci.org/alanshaw/david-www.svg)](https://travis-ci.org/alanshaw/david-www)
[![Dependency Status](https://david-dm.org/alanshaw/david-www.svg)](https://david-dm.org/alanshaw/david-www)
[![devDependency Status](https://david-dm.org/alanshaw/david-www/dev-status.svg)](https://david-dm.org/alanshaw/david-www#info=devDependencies)
[![Donate to help support David development](http://img.shields.io/gratipay/_alanshaw.svg?style=flat)](https://www.gittip.com/_alanshaw/)
___

Node.js based web service that tells you when your project npm dependencies are out of date.
To use David, your project must include a [package.json](https://docs.npmjs.com/files/package.json)
file in the root of your repository.

## Getting Started

With [Node.js](http://nodejs.org/) and [Grunt](http://gruntjs.com/) installed already,
do the following:

* Install david-www:

    ```sh
    cd /path/to/david-www
    npm install
    npm run build
    ```

* Create a `.davidrc` file (see [Configuration](#configuration) section below)
* Run david-www:

    ```sh
    npm start
    ```


## Example usage

View a web page of all dependencies (and their updates, and their versions)
for **public** GitHub repository "grunt-jsio" owned by "alanshaw":

```sh
curl http://localhost:1337/alanshaw/grunt-jsio
```

Get the current build status badge:

```sh
curl http://localhost:1337/alanshaw/grunt-jsio.png
```

## Configuration

Configuration is handled by `rc` (https://github.com/dominictarr/rc), see [config.js](config.js) for default configuration values.

For basic configuration, add a `.davidrc` file in the local directory (it is git ignored) and you can use JSON to override any of the default values.

Register a [github personal oauth token](https://help.github.com/articles/creating-an-access-token-for-command-line-use/) and add it to the config:

```json
{
  "github": {
    "token": "some_github_token"
  }
}
```

You can also use environment variables e.g.

```
david_github__token=some_github_token
```

* (Optional) If you want to use "sign in" feature you should:
    * Register a github developer application and add oauth client id and secret to `.davidrc`.
    * Developer application should have callback URL: `http://localhost:1337/auth/callback`

## Docker Support

This example will run david-www interactively and will exit and destroy the container upon a control-c.

```
docker run -it --rm \
  -p 11337:1337 \
  -e david_github__token=github-token \
  -e david_site__hostname=http://localhost:11337 \
  -v /data/david:/opt/data \
  david
```

This example will run it in detached mode.

```
david run -d --name="david-www" \
  --restart=always \
  -p 11337:1337 \
  -e david_github__token=github-token \
  -e david_site__hostname=http://localhost:11337 \
  -v /data/david:/opt/data \
  david
```

### Building

```
docker build -t david .
```

---

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

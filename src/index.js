#!/usr/bin/env node

const program = require('commander');
const exec = require('child_process').exec;
const fs = require('fs');
const hb = require('handlebars');
const paths = require('path');
const mkdirp = require('mkdirp');
const chalk = require('chalk');
const rimraf = require('rimraf');

hb.registerHelper('lowercase', function (str) {
  if (str && typeof str === "string") {
    return str.toLowerCase();
  }
  return '';
});

program
  .version('1.0.0')
  .usage('[command] [options]')


program
  .command('generate [type] [name]')
  .alias('g')
  .description('generate new component')
  .action(function (type, name) {
    if (type === 'component' || type === 'c') {
      generateComponent(name)
    } else if (type === 'service' || type === 's') {
      generateService(name)
    }
  });


function generateComponent(path) {

  let current = process.cwd();
  let completePath = path.split('/');
  let name = completePath[completePath.length - 1];

  let args = {
    COMPONENT_NAME: upperCamelCase(name),
    COMPONENT_NAME_RAW: name,
    COMPONENT_STYLES_URL: `./${name}.component.scss`,
    COMPONENT_COMMON_STYLE_URL: `${name}.component`,
    COMPONENT_TEMPLATE_URL: `./${name}.component.html`,
    COMPONENT_FILE_NAME: name,
    COMPONENT_SELECTOR: `ns-${name}`
  };

  console.log('installing component')
  copyBluePrints(name, 'component', () => {
    modifyComponentTs(name, args, () => {
      copyComponentToProjectDir(name, completePath, () => {
        removeTmpFiles(name, () => {
          console.log(chalk.yellow('sucessfully created'))
        })
      })
    })
  })
}

function copyBluePrints(name, type, callback) {
  if (type === 'component') {
    fs.mkdir(__dirname + `/tmp/${name}`, function (e) {
      if (!e || (e && e.code === 'EEXIST')) {
        fs.createReadStream(__dirname + '/blueprints/component/__path__/__name__.component.ts.__')
          .pipe(fs.createWriteStream(__dirname + `/tmp/${name}/${name}.component.ts`));
        fs.createReadStream(__dirname + '/blueprints/component/__path__/__name__.component.ios.css.__')
          .pipe(fs.createWriteStream(__dirname + `/tmp/${name}/${name}.component.ios.css`));
        fs.createReadStream(__dirname + '/blueprints/component/__path__/__name__.component.android.css.__')
          .pipe(fs.createWriteStream(__dirname + `/tmp/${name}/${name}.component.android.css`));
        fs.createReadStream(__dirname + '/blueprints/component/__path__/__name__.component.css.__')
          .pipe(fs.createWriteStream(__dirname + `/tmp/${name}/_${name}.component.css`));
        fs.createReadStream(__dirname + '/blueprints/component/__path__/__name__.component.html.__')
          .pipe(fs.createWriteStream(__dirname + `/tmp/${name}/${name}.component.html`));
        fs.createReadStream(__dirname + '/blueprints/component/__path__/__name__.module.ts.__')
          .pipe(fs.createWriteStream(__dirname + `/tmp/${name}/${name}.module.ts`));
        fs.createReadStream(__dirname + '/blueprints/component/__path__/__name__.routing.module.ts.__')
          .pipe(fs.createWriteStream(__dirname + `/tmp/${name}/${name}.routing.module.ts`));
        callback(true)
      } else {
        console.log(e);
      }
    });
  } else if (type === 'service') {
    fs.mkdir(__dirname + `/tmp/${name}`, function (e) {
      if (!e || (e && e.code === 'EEXIST')) {
        fs.createReadStream(__dirname + '/blueprints/service/__name__.service.ts.__')
          .pipe(fs.createWriteStream(__dirname + `/tmp/${name}/${name}.service.ts`));
        callback(true)
      } else {
        console.log(e);
      }
    });
  }
}

function modifyComponentTs(name, args, callback) {
  fs.readFile(__dirname + `/tmp/${name}/${name}.component.ts`, 'utf-8', function (err, content) {
    let source = hb.compile(content);
    let result = source(args);
    fs.writeFile(__dirname + `/tmp/${name}/${name}.component.ts`, result, 'utf-8', function (err) {
      if (err) throw err;

      fs.readFile(__dirname + `/tmp/${name}/${name}.module.ts`, 'utf-8', function (err, content) {
        let source = hb.compile(content);
        let result = source(args);
        fs.writeFile(__dirname + `/tmp/${name}/${name}.module.ts`, result, 'utf-8', function (err) {
          if (err) throw err;

          fs.readFile(__dirname + `/tmp/${name}/${name}.routing.module.ts`, 'utf-8', function (err, content) {
            let source = hb.compile(content);
            let result = source(args);
            fs.writeFile(__dirname + `/tmp/${name}/${name}.routing.module.ts`, result, 'utf-8', function (err) {
              if (err) throw err;

              fs.readFile(__dirname + `/tmp/${name}/${name}.component.ios.css`, 'utf-8', function (err, content) {
                let source = hb.compile(content);
                let result = source(args);
                fs.writeFile(__dirname + `/tmp/${name}/${name}.component.ios.css`, result, 'utf-8', function (err) {
                  if (err) throw err;

                  fs.readFile(__dirname + `/tmp/${name}/${name}.component.android.css`, 'utf-8', function (err, content) {
                    let source = hb.compile(content);
                    let result = source(args);
                    fs.writeFile(__dirname + `/tmp/${name}/${name}.component.android.css`, result, 'utf-8', function (err) {
                      if (err) throw err;
                      callback()
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

function upperCamelCase(s) {
  return s
    .replace(s[0], s[0].toUpperCase())
    .replace(/(\-\w)/g, function (m) {
      return m[1].toUpperCase();
    });
}

function copyComponentToProjectDir(name, completePath, callback) {
  let current = process.cwd()
  let prefix = 'src'

  completePath.forEach((p) => {
    prefix += `/${p}`
  })

  mkdirp(current + `/${prefix}`, function (e) {

    if (!e || (e && e.code === 'EEXIST')) {
      fs.createReadStream(__dirname + `/tmp/${name}/${name}.component.ts`)
        .pipe(fs.createWriteStream(current + `/${prefix}/${name}.component.ts`));
      console.log(chalk.green(' create'), `${prefix}/${name}.component.ts`);

      fs.createReadStream(__dirname + `/tmp/${name}/${name}.module.ts`)
        .pipe(fs.createWriteStream(current + `/${prefix}/${name}.module.ts`));
      console.log(chalk.green(' create'), `${prefix}/${name}.module.ts`);

      fs.createReadStream(__dirname + `/tmp/${name}/${name}.routing.module.ts`)
        .pipe(fs.createWriteStream(current + `/${prefix}/${name}.routing.module.ts`));
      console.log(chalk.green(' create'), `${prefix}/${name}.routing.module.ts`);

      fs.createReadStream(__dirname + `/tmp/${name}/_${name}.component.css`)
        .pipe(fs.createWriteStream(current + `/${prefix}/_${name}.component.scss`));
      console.log(chalk.green(' create'), `${prefix}/_${name}.component.scss`);

      fs.createReadStream(__dirname + `/tmp/${name}/${name}.component.ios.css`)
        .pipe(fs.createWriteStream(current + `/${prefix}/${name}.component.ios.scss`));
      console.log(chalk.green(' create'), `${prefix}/${name}.component.ios.scss`);

      fs.createReadStream(__dirname + `/tmp/${name}/${name}.component.android.css`)
        .pipe(fs.createWriteStream(current + `/${prefix}/${name}.component.android.scss`));
      console.log(chalk.green(' create'), `${prefix}/${name}.component.android.scss`);

      fs.createReadStream(__dirname + `/tmp/${name}/${name}.component.html`)
        .pipe(fs.createWriteStream(current + `/${prefix}/${name}.component.html`));
      console.log(chalk.green(' create'), `${prefix}/${name}.component.html`);

      callback(true)
    } else {
      console.log(e);
    }
  });
}

function removeTmpFiles(name, callback) {
  rimraf(__dirname + `/tmp/${name}`, function () {
    callback(true)
  })
}


function generateService(path) {
  let current = process.cwd();
  let completePath = path.split('/');
  let name = completePath[completePath.length - 1];

  let args = {
    SERVICE_NAME: upperCamelCase(name),
  };

  console.log('installing service')
  copyBluePrints(name, 'service', () => {
    modifyService(name, args, () => {
      copyServiceToProjectDir(name, completePath, () => {
        removeTmpFiles(name, () => {
          console.log(chalk.yellow('sucessfully created'))
        })
      })
    })
  })
}


function modifyService(name, args, callback) {
  fs.readFile(__dirname + `/tmp/${name}/${name}.service.ts`, 'utf-8', function (err, content) {
    let source = hb.compile(content);
    let result = source(args);
    console.log(result);
    fs.writeFile(__dirname + `/tmp/${name}/${name}.service.ts`, result, 'utf-8', function (err) {
      if (err) throw err;
      callback()
    });
  });
}


function copyServiceToProjectDir(name, completePath, callback) {
  let current = process.cwd()
  let prefix = 'src/app'

  completePath.pop()
  completePath.forEach((p) => {
    prefix += `/${p}`
  })

  mkdirp(current + `/${prefix}`, function (e) {

    if (!e || (e && e.code === 'EEXIST')) {
      fs.createReadStream(__dirname + `/tmp/${name}/${name}.service.ts`)
        .pipe(fs.createWriteStream(current + `/${prefix}/${name}.service.ts`));
      console.log(chalk.green(' create'), `${prefix}/${name}.service.ts`)

      callback(true)
    } else {
      console.log(e);
    }
  });
}

program.parse(process.argv);

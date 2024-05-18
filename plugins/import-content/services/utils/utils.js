"use strict";
const request = require("request");
const contentTypeParser = require("content-type-parser");
const RssParser = require("rss-parser");
const CsvParser = require("csv-parse/lib/sync");
const urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\- ;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
const URL_REGEXP = new RegExp(urlRegEx);
const validateUrl = url => {
  URL_REGEXP.lastIndex = 0;
  return URL_REGEXP.test(url);
};
const EMAIL_REGEXP = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const CATEGORIES = [
  {
    name: "Vinaphone",
    list: ["091", "094", "088", "081", "082", "083", "084", "085"]
  },
  {
    name: "Mobifone",
    list: ["090", "093", "089", "070", "076", "077", "078", "079"]
  },
  {
    name: "Viettel",
    list: [
      "096",
      "097",
      "098",
      "086",
      "032",
      "033",
      "034",
      "035",
      "036",
      "037",
      "038",
      "039"
    ]
  },
  {
    name: "Vietnamobile",
    list: ["092", "052", "053", "054", "055", "056", "057", "058"]
  },
  { name: "Gmobile", list: ["099", "059"] },
  { name: "iTelecom", list: ["087"] }
];

const getCategoryName = (prefix) => {
  switch (prefix) {
    //"091", "094", "088", "081", "082", "083", "084", "085"
    case '091':
    case '094':
    case '088':
    case '081':
    case '082':
    case '083':
    case '084':
    case '085':
      return 'Vinaphone';
    //"090", "093", "089", "070", "076", "077", "078", "079"
    case '090':
    case '093':
    case '089':
    case '070':
    case '076':
    case '077':
    case '078':
    case '079':

      return 'Mobifone'
    case "096":
    case "097":
    case "098":
    case "086":
    case "032":
    case "033":
    case "034":
    case "035":
    case "036":
    case "037":
    case "038":
    case "039":
      return 'Viettel';
    case '092': //"092", "052", "053", "054", "055", "056", "057", "058"
    case '052':
    case '053':
    case '054':
    case '055':
    case '056':
    case '057':
    case '058':
      return 'Vietnamobile';
    case '099':
    case '059':
      return 'Gmobile';
    case '087':
      return 'iTelecom';
    default:
      return 'Homephone';
  }
}

const stringIsEmail = data => {
  EMAIL_REGEXP.lastIndex = 0;
  return EMAIL_REGEXP.test(data);
};
const getDataFromUrl = url => {
  return new Promise((resolve, reject) => {
    if (!validateUrl(url)) return reject("invalid URL");
    request(url, null, async (err, res, body) => {
      if (err) {
        reject(err);
      }
      resolve({ dataType: res.headers["content-type"], body });
    });
  });
};
const resolveDataFromRequest = async ctx => {
  const { source, type, options, data, merchant } = ctx.request.body;
  switch (source) {
    case "upload":
    case "raw":
      return { dataType: type, body: data, options, merchant };
    case "url":
      const { dataType, body } = await getDataFromUrl(options.url);
      return { dataType, body, options };

  }
};

const getItemsFromData = ({ dataType, body, options, merchant }) =>
  new Promise(async (resolve, reject) => {
    const parsedContentType = contentTypeParser(dataType);
    if (parsedContentType.isXML()) {
      const parser = new RssParser();
      const feed = await parser.parseString(body);
      return resolve({ sourceType: "rss", items: feed.items });
    }
    if (dataType === "text/csv" || dataType === "application/vnd.ms-excel") {
      console.log(options, '<=== OPTIONS')
      try {
        const items = CsvParser(body, {
          ...options,
          columns: true
        });
        const filteredItems = items.filter(e => e.name && e.price && e.price.length > 5);
        if (merchant) {
          return resolve({
            sourceType: "csv",
            items: filteredItems.map(item => {
              if (item.name && merchant) {
                let name = item.name.trim();
                if (name.charAt(0) !== "0") {
                  name = "0" + name;
                }
                item.price = item.price.replace(/[ ,.]/g, "");
                item.displayName = name.replace(/[ ,]/g, ".");
                item.name = name.replace(/[ ,.]/g, "");
                const cat = CATEGORIES.filter(e => {
                  return e.list.indexOf(item.name.slice(0, 3)) > -1;
                });
                if (cat.length) {
                  item.category = cat[0].name;
                } else {
                  item.category = "Điện Thoại Bàn";
                }
              }
              return {
                ...item,
                merchant
              };
            })
          });
        } else {
          return resolve({ sourceType: "csv", items });
        }
      }
      catch (error) {
        reject(new Error(error));
      }
    }
    reject({
      contentType: parsedContentType.toString()
    });
  });

const urlIsMedia = url => {
  try {
    const parsed = new URL(url);
    const extension = parsed.pathname
      .split(".")
      .pop()
      .toLowerCase();
    switch (extension) {
      case "png":
      case "gif":
      case "jpg":
      case "jpeg":
      case "svg":
      case "bmp":
      case "tif":
      case "tiff":
        return true;
      case "mp3":
      case "wav":
      case "ogg":
        return true;
      case "mp4":
      case "avi":
        return true;
      default:
        return false;
    }
  } catch (error) {
    return false;
  }
};

module.exports = {
  resolveDataFromRequest,
  getItemsFromData,
  getDataFromUrl,
  stringIsEmail,
  urlIsMedia,
  getCategoryName
};

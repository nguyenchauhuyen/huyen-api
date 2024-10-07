"use strict";

/**
 * import-content.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

const { resolveDataFromRequest, getItemsFromData, getCategoryName } = require("./utils/utils");
const analyzer = require("./utils/analyzer");
const _ = require("lodash");
// const importFields = require("./utils/importFields");
// const importMediaFiles = require("./utils/importMediaFiles");

const import_queue = {};
const importNextItem = async (importConfig, merchant) => {

  const items = [];
  while (import_queue[importConfig.id].length > 0 && items.length < 100) {
    items.push(import_queue[importConfig.id].shift());
  }

  if (!items.length) {
    console.log("import complete");
    await strapi
      .query("importconfig", "import-content")
      .update({ id: importConfig.id }, { ongoing: false });
    return;
  }

  try {
    const importedItems = items.filter(it => {
      let name = it.name.trim();
      if (name.charAt(0) !== "0") {
        name = "0" + name;
      }
      const shortName = name?.replace(/\D/g, "");
      return shortName.length === 10 && it.price
    }).map((sourceItem) => {
      let name = sourceItem.name.trim();
      if (name.charAt(0) !== "0") {
        name = "0" + name;
      }
      const shortName = name?.replace(/\D/g, "");

      return {
        name: shortName,
        price: sourceItem.price.replace(/\D/g, ""),
        displayName: name.replace(/[ ,]/g, "."),
        category: getCategoryName(shortName.slice(0, 3)),
        merchant
      };
    });

    // const importedItem = await importFields(
    //   sourceItem,
    //   importConfig.fieldMapping
    // );

    console.log("==>", items.map(it => it.name));

    // await strapi
    //   .query(importConfig.contentType)
    //   .createMany(importedItems);

    const model = strapi.query(importConfig.contentType).model;
    const bulkOps = importedItems.map(document => { return { insertOne: { document } } });

    // Execute bulk operations
    await model.bulkWrite(bulkOps, { ordered: false });

  } catch (e) {
    console.log(e);
  }
  const { IMPORT_THROTTLE } = strapi.plugins["import-content"].config;
  setTimeout(() => importNextItem(importConfig, merchant), IMPORT_THROTTLE || 5000);
};

const undo_queue = {};
const removeImportedFiles = async (fileIds, uploadConfig) => {
  const removePromises = fileIds.map(id =>
    strapi.plugins["upload"].services.upload.remove({ id }, uploadConfig)
  );
  return await Promise.all(removePromises);
};
const undoNextItem = async (importConfig, uploadConfig) => {
  const item = undo_queue[importConfig.id].shift();
  if (!item) {
    console.log("undo complete");
    await strapi
      .query("importconfig", "import-content")
      .update({ id: importConfig.id }, { ongoing: false });
    return;
  }
  try {
    await strapi.query(importConfig.contentType).delete({ id: item.ContentId });
  } catch (e) {
    console.log(e);
  }
  try {
    const importedFileIds = _.compact(item.importedFiles.fileIds);
    await removeImportedFiles(importedFileIds, uploadConfig);
  } catch (e) {
    console.log(e);
  }
  try {
    await strapi.query("importeditem", "import-content").delete({
      id: item.id
    });
  } catch (e) {
    console.log(e);
  }
  const { UNDO_THROTTLE } = strapi.plugins["import-content"].config;
  setTimeout(() => undoNextItem(importConfig, uploadConfig), UNDO_THROTTLE);
};

module.exports = {
  preAnalyzeImportFile: async ctx => {
    const { dataType, body, options } = await resolveDataFromRequest(ctx);
    const { sourceType, items } = await getItemsFromData({
      dataType,
      body,
      options
    });
    const analysis = analyzer.analyze(sourceType, items);
    return { sourceType, ...analysis };
  },
  importItems: (importConfig, ctx) => {
    new Promise(async (resolve, reject) => {
      const { dataType, body, merchant } = await resolveDataFromRequest(ctx);
      try {
        // const { items } = await getItemsFromData({
        //   dataType,
        //   body,
        //   options: importConfig.options,
        //   merchant
        // });

        import_queue[importConfig.id] = body;

        if (merchant) {
          console.log("DELETE ALL", merchant);
          let count = await strapi
            .query(importConfig.contentType)
            .count({ merchant: merchant });

          while (count > 0) {
            console.log(`${merchant} =>>`, count);

            const model = strapi.query(importConfig.contentType).model;

            // Create bulk operations
            const bulkOps = [
              {
                deleteMany: {
                  filter: { merchant }
                }
              }
            ];

            // Execute bulk operations
            await model.bulkWrite(bulkOps);

            count = await strapi
              .query(importConfig.contentType)
              .count({ merchant: merchant });
          }
        }
        resolve({
          status: "import started",
          importConfigId: importConfig.id
        });

        body.length > 0 && importNextItem(importConfig, merchant);
      } catch (error) {
        console.log(error, 'ERROR')
        reject(new Error(error));
      }
    });
  },
  undoItems: importConfig =>
    new Promise(async (resolve, reject) => {
      try {
        undo_queue[importConfig.id] = importConfig.importeditems;
      } catch (error) {
        reject(error);
      }
      await strapi
        .query("importconfig", "import-content")
        .update({ id: importConfig.id }, { ongoing: true });
      resolve({
        status: "undo started",
        importConfigId: importConfig.id
      });
      const uploadConfig = await strapi
        .store({
          environment: strapi.config.environment,
          type: "plugin",
          name: "upload"
        })
        .get({ key: "provider" });
      undoNextItem(importConfig, uploadConfig);
    })
};

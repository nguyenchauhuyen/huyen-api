/*
*
* HomePage
*
 */
import {
  HeaderNav,
  PluginHeader
} from "strapi-helper-plugin";
import Row from "../../components/Row";
import Block from "../../components/Block";
import { Select, Label } from "@buffetjs/core";
import { get, has, isEmpty, pickBy, set } from "lodash";
import styled from "styled-components";

const getUrl = to =>
  to ? `/plugins/${pluginId}/${to}` : `/plugins/${pluginId}`;
import React, { memo, Component } from "react";
import { request } from "strapi-helper-plugin";
import pluginId from "../../pluginId";
import UploadFileForm from "../../components/UploadFileForm";
import MappingTable from "../../components/MappingTable";
import { Button } from "@buffetjs/core";
import { LoadingBar } from '@buffetjs/styles';
import Autocomplete from 'react-select';
class HomePage extends Component {
  state = {
    loading: true,
    saving: false,
    modelOptions: [],
    models: [],
    merchantOptions: [],
    merchants: [],
    importSource: "upload",
    analyzing: false,
    analysis: null,
    selectedContentType: "application::product.product",
    selectedMerchant: "",
    fieldMapping: {}
  };

  importSources = [
    { label: "External URL ", value: "url" },
    { label: "Upload file", value: "upload" },
    { label: "Raw text", value: "raw" }
  ];

  // customStyles = {
  //   control: base => ({
  //     ...base,
  //     height: 34,
  //     minHeight: 34
  //   })
  // };

  getModels = async () => {
    try {
      const response = await request("/content-type-builder/content-types", {
        method: "GET"
      });

      // Remove non-user content types from models
      const models = get(response, ["data"], []).filter(
        obj => !has(obj, "plugin")
      );
      const modelOptions = models.map(model => {
        return {
          label: get(model, ["schema", "name"], ""), // (name is used for display_name)
          value: model.uid // (uid is used for table creations)
        };
      });
      return { models, modelOptions };
    } catch (e) {
      strapi.notification.error(`${e}`);
    }
    return [];
  };

  getMerchants = async () => {
    try {
      const merchants = await request("/merchants?_sort=name:asc&_limit=1000", {
        method: "GET"
      });
      const merchantOptions = merchants.map(model => {
        return {
          label: model.name, // (name is used for display_name)
          value: model.id // (uid is used for table creations)
        };
      });
      return { merchants, merchantOptions };
    } catch (e) {
      strapi.notification.error(`${e}`);
    }
    return [];
  };

  onRequestAnalysis = async analysisConfig => {
    this.analysisConfig = analysisConfig;
    this.setState({ analyzing: true }, async () => {
      try {
        console.log(analysisConfig, '===Config');
        let analysis = {};

        if (this.state.selectedContentType === "application::product.product") {
          let itemCount = analysisConfig.data.split("\n").length - 1;
          analysis = {
            sourceType: analysisConfig.sourceType,
            itemCount: itemCount,
            fieldStats: [
              {
                fieldName: "name",
                count: itemCount,
                format: "string",
                minLength: 1,
                maxLength: 200
              },
              {
                fieldName: "displayName",
                count: itemCount,
                format: "string",
                minLength: 1,
                maxLength: 200
              },
              {
                fieldName: "price",
                count: itemCount,
                format: "string",
                minLength: 1,
                maxLength: 200
              },
              {
                fieldName: "category",
                count: itemCount,
                format: "string",
                minLength: 1,
                maxLength: 200
              },
              {
                fieldName: "merchant",
                count: itemCount,
                format: "string",
                minLength: 1,
                maxLength: 200
              }
            ]
          };
        } else {
          const response = await request(
            "/import-content/preAnalyzeImportFile",
            {
              method: "POST",
              body: analysisConfig
            }
          );

          analysis = {
            sourceType: response.sourceType,
            itemCount: response.itemCount,
            fieldStats: [...response.fieldStats]
          };
        }

        this.setState({ analysis, analyzing: false }, () => {
          strapi.notification.success(`Analyzed Successfully`);
        });
      } catch (e) {
        this.setState({ analyzing: false }, () => {
          strapi.notification.error(`Analyze Failed, try again`);
          strapi.notification.error(`${e}`);
        });
      }
    });
  };

  selectImportSource = importSource => {
    this.setState({ importSource });
  };

  selectImportDest = selectedContentType => {
    this.setState({ selectedContentType });
  };

  selectMerchant = selectedMerchant => {
    console.log(selectedMerchant);
    this.setState({ selectedMerchant });
  };

  getTargetModel = () => {
    // <---
    const { models } = this.state;
    if (!models) return null;
    return models.find(model => model.uid === this.state.selectedContentType);
  };

  setFieldMapping = fieldMapping => {
    // <---
    console.log(fieldMapping);
    this.setState({ fieldMapping });
  };

  onSaveImport = async () => {
    const {
      selectedContentType,
      selectedMerchant,
      fieldMapping,
      analysis
    } = this.state;
    const { analysisConfig } = this;

    if (!!selectedMerchant) {
      this.setState({ saving: true });
      let defaultMapping = fieldMapping;
      analysis.fieldStats.forEach(field => {
        if (!fieldMapping[field.fieldName]) {
          defaultMapping[field.fieldName] = { targetField: field.fieldName };
        }
      });
      const importConfig =
        selectedContentType === "application::product.product"
          ? {
            ...analysisConfig,
            contentType: selectedContentType,
            merchant: selectedMerchant.value,
            fieldMapping: {
              ...defaultMapping
            }
          }
          : {
            ...analysisConfig,
            contentType: selectedContentType,
            fieldMapping
          };
      try {
        await request("/import-content", {
          method: "POST",
          body: importConfig
        });
        console.log(selectedMerchant)
        this.setState({ saving: false }, () => {
          strapi.notification.info("Import started");
        });
      } catch (e) {
        strapi.notification.error(`${e}`);
      }
    } else {
      strapi.notification.error(`Please select Merchant`);
    }
  };

  componentDidMount() {
    this.getModels().then(res => {
      const { models, modelOptions } = res;
      this.setState({
        models,
        modelOptions,
        selectedContentType: modelOptions ? "application::product.product" : ""
      });

      this.getMerchants().then(res => {
        const { merchants, merchantOptions } = res;
        this.setState({
          loading: false,
          merchants,
          merchantOptions,
        });
        // selectedMerchant: merchantOptions ? merchantOptions[0].value : ""
      });

    });
  }


  render() {
    return (
      <div className={"container-fluid"} style={{ padding: "18px 30px" }}>
        <PluginHeader
          title={"Import Content"}
          description={"Import CSV and RSS-Feed into your Content Types"}
        />
        <HeaderNav
          links={[
            {
              name: "Import Data",
              to: getUrl("")
            },
            {
              name: "Import History",
              to: getUrl("history")
            }
          ]}
          style={{ marginTop: "4.4rem" }}
        />
        <div className="row">
          {!this.state.loading && <Block
            title="General"
            description="Configure the Import Source & Destination"
            style={{ marginBottom: 12 }}
          >
            <Row className={"row"}>
              <div className={"col-4"}>
                <Label htmlFor="importSource">Import Source</Label>
                <Select
                  name="importSource"
                  options={this.importSources}
                  value={this.state.importSource}
                  onChange={({ target: { value } }) =>
                    this.selectImportSource(value)
                  }
                />
              </div>
              <div className={"col-4"}>
                <Label htmlFor="importDest">Import Destination</Label>
                <Select
                  value={this.state.selectedContentType}
                  name="importDest"
                  options={this.state.modelOptions}
                  onChange={({ target: { value } }) =>
                    this.selectImportDest(value)
                  }
                />
              </div>
              <div className={"col-4"}>
                <Label htmlFor="importMerchant">Merchant</Label>
                {/* <Select
                  value={this.state.selectedMerchant}
                  name="importMerchant"
                  options={this.state.merchantOptions}
                  onChange={({ target: { value } }) =>
                    this.selectMerchant(value)
                  }
                /> */}
                <SearchDropdown
                  // className="basic-single"
                  classNamePrefix="select"
                  isClearable={true}
                  // isRtl={isRtl}
                  isSearchable={true}
                  name="importMerchant"
                  options={this.state.merchantOptions}
                  onChange={this.selectMerchant}
                />
              </div>
            </Row>
            <UploadFileForm
              onRequestAnalysis={this.onRequestAnalysis}
              loadingAnalysis={this.state.analyzing}
            />
          </Block>}
          {this.state.loading && <Block><LoadingBar /></Block>}
        </div>
        {this.state.analysis && (
          <Row className="row">
            <MappingTable
              analysis={this.state.analysis}
              targetModel={this.getTargetModel()}
              onChange={this.setFieldMapping}
            />
            <Button
              style={{ marginTop: 12 }}
              label={"Run the Import"}
              onClick={this.onSaveImport}
              isLoading={this.state.saving}
            />
          </Row>
        )}
      </div>
    );
  }
}

const SearchDropdown = styled(Autocomplete)`
  .select__control {
    height: 34px;
    min-height:34px;
  }
`

export default memo(HomePage);


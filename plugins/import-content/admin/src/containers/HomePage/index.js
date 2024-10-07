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
import { get, has } from "lodash";
import styled from "styled-components";

const getUrl = to =>
    to ? `/plugins/${pluginId}/${to}` : `/plugins/${pluginId}`;
import React, { memo, Component } from "react";
import { request } from "strapi-helper-plugin";
import pluginId from "../../pluginId";
// import UploadFileForm from "../../components/UploadFileForm";
import MappingTable from "../../components/MappingTable";
import { Button, Textarea } from "@buffetjs/core";
import { LoadingBar } from '@buffetjs/styles';
import Autocomplete from 'react-select';
import Papa from 'papaparse';
import { PopUpWarning } from "strapi-helper-plugin";

class HomePage extends Component {
    state = {
        loading: true,
        saving: false,
        modelOptions: [],
        models: [],
        merchantOptions: [],
        merchants: [],
        importSource: "raw",
        analyzing: false,
        analysis: null,
        selectedContentType: "application::product.product",
        selectedMerchant: "",
        selectedDelimiter: '\t',
        selectedUnitPrice: '',
        fieldMapping: {},
        showDeleteModal: false,
        csvData: "",
    };

    // importSources = [
    //     { label: "External URL ", value: "url" },
    //     { label: "Upload file", value: "upload" },
    //     { label: "Raw text", value: "raw" }
    // ];

    delimiterTypes = [
        { label: 'Tab', value: '\t' },
        { label: ',', value: ',' },
        { label: '|', value: '|' },
        { label: ';', value: ';' },
    ]

    unitPriceTypes = [
        { label: 'Original', value: '' },
        { label: 'X1000', value: '000' },
        { label: 'X1000000', value: '000000' },
    ]

    // getModels = async () => {
    //     try {
    //         const response = await request("/content-type-builder/content-types", {
    //             method: "GET"
    //         });

    //         // Remove non-user content types from models
    //         const models = get(response, ["data"], []).filter(
    //             obj => !has(obj, "plugin")
    //         );
    //         const modelOptions = models.map(model => {
    //             return {
    //                 label: get(model, ["schema", "name"], ""), // (name is used for display_name)
    //                 value: model.uid // (uid is used for table creations)
    //             };
    //         });
    //         return { models, modelOptions };
    //     } catch (e) {
    //         strapi.notification.error(`${e}`);
    //     }
    //     return [];
    // };

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

    selectDelimiter = selectedDelimiter => {
        this.setState({ selectedDelimiter })
    }

    csvDataChange = (e) => {
        this.setState({ csvData: e.target.value });
    }

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
            analysis,
            selectedUnitPrice
        } = this.state;
        // const { analysisConfig } = this;

        try {

            const data = selectedUnitPrice ? analysis.data.map(it => { return { name: it.name, price: it.price ? `${it.price}${selectedUnitPrice}` : 0 } }) : analysis.data;
            const payload = { "source": analysis.sourceType, "type": "text/csv", "options": {}, "data": data, "contentType": selectedContentType, "fieldMapping": { "name": { "targetField": "name" }, "displayName": { "targetField": "displayName" }, "price": { "targetField": "price" }, "category": { "targetField": "category" }, "merchant": { "targetField": "merchant" } } };

            if (selectedMerchant) {
                this.setState({ saving: true });
                await request("/import-content", {
                    method: "POST",
                    body: { ...payload, merchant: selectedMerchant.value }
                });
                this.setState({ saving: false }, () => {
                    strapi.notification.info("Import started");
                });
            } else {
                strapi.notification.error(`Please select Merchant`);
            }
        } catch (e) {
            this.setState({ saving: false }, () => {
                strapi.notification.error(`${e}`);
            });
        }
    };

    handleClear = async () => {
        try {
            if (this.state.selectedMerchant) {
                const payload = { "source": "upload", "type": "text/csv", "options": {}, "data": "", "contentType": "application::product.product", "fieldMapping": { "name": { "targetField": "name" }, "displayName": { "targetField": "displayName" }, "price": { "targetField": "price" }, "category": { "targetField": "category" }, "merchant": { "targetField": "merchant" } } };

                await request("/import-content", {
                    method: "POST",
                    body: { ...payload, merchant: this.state.selectedMerchant.value }
                });
                this.setState({ showDeleteModal: false }, () => {
                    strapi.notification.info("Import started");
                });
            }
            else {
                strapi.notification.error(`Please select Merchant`);
            }
        } catch (e) {
            strapi.notification.error(`${e}`);
        }
    }

    componentDidMount() {
        // this.getModels().then(res => {
        //     const { models, modelOptions } = res;
        //     this.setState({
        //         models,
        //         modelOptions,
        //         selectedContentType: modelOptions ? "application::product.product" : ""
        //     });
        // });

        this.getMerchants().then(res => {
            const { merchants, merchantOptions } = res;
            this.setState({
                loading: false,
                merchants,
                merchantOptions,
            });
        });

    }

    handleParseCSV = async () => {
        const results = Papa.parse(`name${this.state.selectedDelimiter}price
${this.state.csvData}`, {
            delimiter: this.state.selectedDelimiter,
            header: true,
            newline: "",
            // delimitersToGuess: ['\t', ',', '|', ';']
        });
        console.log(results);

        let analysis = {
            sourceType: 'raw',
            data: results.data,
            fieldStats: [
                {
                    fieldName: "name",
                    count: results.data?.filter(it => it.name?.length).length,
                    format: "string",
                    minLength: 1,
                    maxLength: 200
                },
                {
                    fieldName: "price",
                    count: results.data?.filter(it => it.price?.length).length,
                    format: "string",
                    minLength: 1,
                    maxLength: 200
                },
            ]
        };

        this.setState({ analysis, analyzing: false }, () => {
            strapi.notification.success(`Analyzed Successfully`);
        });

    }

    render() {
        return (
            <div className={"container-fluid"} style={{ padding: "18px 30px" }}>
                <PluginHeader
                    title={"Import Data"}
                    description={"Import CSV and RSS-Feed into your Content Types"}
                />
                <HeaderNav
                    links={[
                        {
                            name: "Import Data",
                            to: getUrl("")
                        },
                        // {
                        //     name: "Import History",
                        //     to: getUrl("history")
                        // }
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
                            {/* <div className={"col-2"}>
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
                            <div className={"col-2"}>
                                <Label htmlFor="importDest">Destination</Label>
                                <Select
                                    value={this.state.selectedContentType}
                                    name="importDest"
                                    options={this.state.modelOptions}
                                    onChange={({ target: { value } }) =>
                                        this.selectImportDest(value)
                                    }
                                />
                            </div> */}
                            <div className={"col-2"}>
                                <Label htmlFor="importDest">Delimiter</Label>
                                <Select
                                    value={this.state.selectedDelimiter}
                                    name="importDelimiter"
                                    options={this.delimiterTypes}
                                    onChange={({ target: { value } }) =>
                                        this.selectDelimiter(value)
                                    }
                                />
                            </div>
                            <div className={"col-2"}>
                                <Label htmlFor="importPrice">Unit Price</Label>
                                <Select
                                    value={this.state.selectedUnitPrice}
                                    name="importUnitPrice"
                                    options={this.unitPriceTypes}
                                    onChange={({ target: { value } }) =>
                                        this.setState({ selectedUnitPrice: value })
                                    }
                                />
                            </div>
                            <div className={"col-4"}>
                                <Label htmlFor="importMerchant">Merchant</Label>

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
                        {/* {this.state.selectedMerchant && <UploadFileForm
              merchant={this.state.selectedMerchant}
              onRequestAnalysis={this.onRequestAnalysis}
              onClear={this.handleClear}
              loadingAnalysis={this.state.analyzing}
            />} */}

                        <Row className={"row"}>
                            <div className={"col-12"}>
                                <Label htmlFor="importContent">Import Data</Label>
                                <Textarea style={{
                                    width: '100 %',
                                    height: '50vh',
                                    margin: '16px 0',
                                    padding: '16px',
                                    border: 'solid 1px #ccc'
                                }}
                                    type="textarea" name="importContent" value={this.state.csvData} onChange={this.csvDataChange} />
                            </div>
                        </Row>

                        <Row className={"row"}>
                            <div className={"col-4"}>
                                <Button
                                    label={"Parse"}
                                    color="secondary"
                                    onClick={this.handleParseCSV}
                                />
                            </div>
                            <div className={"col-4"}>
                                <Button
                                    label={"Xóa Bảng"}
                                    color={this.state.selectedMerchant ? "secondary" : "cancel"}
                                    disabled={!this.state.selectedMerchant}
                                    onClick={() => this.setState({ showDeleteModal: true })}
                                />
                            </div>
                            {this.state.selectedMerchant && <PopUpWarning
                                isOpen={this.state.showDeleteModal}
                                toggleModal={() => this.setState({ showDeleteModal: false })}
                                content={{
                                    title: `Vui Lòng Xác nhận`,
                                    message: `Bạn có chắc muốn xóa bảng sim từ đại lý ${this.state.selectedMerchant?.label} ?`
                                }}
                                popUpWarningType="danger"
                                onConfirm={this.handleClear}
                            />}

                        </Row>
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


"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchImage = exports.checkSocial = void 0;
const axios_1 = __importDefault(require("axios"));
const checkSocial = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const serializer = getMetadataAccountDataSerializer()
        // const metadataPDA = getPdaMetadataKey(baseMint);
        // const metadataAccount = await connection.getAccountInfo(metadataPDA.publicKey, commitment);
        // if (!metadataAccount?.data) {
        //   return { ok: false, message: 'Mutable -> Failed to fetch account data' };
        // }
        // const deserialize = serializer.deserialize(metadataAccount.data);
        // const metadata = deserialize[0];
        // console.log("🚀 ~ checkSocial ~ metadata:", metadata);
        // console.log("🚀 ~ checkSocial ~ metadata:", metadata.uri);
        // return {
        //     ok: true,
        //     data: metadata
        // };
    }
    catch (error) {
        console.log(":rocket: ~ checkSocial ~ error:", error);
        return {
            ok: false,
            message: "Fetching data error!"
        };
    }
});
exports.checkSocial = checkSocial;
const fetchImage = (uri) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.get(uri, { timeout: 1000 }); // Adjust timeout based on typical response times
        return response.data.image;
    }
    catch (error) {
        console.log('Error fetching image:', error.message || error.code);
        return "https://image-optimizer.jpgstoreapis.com/37d60fa1-bca9-4082-868f-5e081600ea3b?width=600";
    }
});
exports.fetchImage = fetchImage;

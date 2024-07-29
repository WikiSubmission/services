import {
  GetObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  GetObjectCommandInput,
  GetObjectCommandOutput,
  PutObjectCommand,
  PutObjectCommandInput,
  PutObjectCommandOutput,
} from "@aws-sdk/client-s3";

import { Readable } from "stream";
import { SystemUtilities } from "./SystemUtils";

export interface GetObjectCommandOutputExtended extends GetObjectCommandOutput {
  Key: string;
  Extension: string;
}

export interface PutObjectCommandOutputExtended extends PutObjectCommandOutput {
  Key: string;
  Extension: string;
}

export class S3Utils {
  static async listObjects(additionalParams?: ListObjectsV2CommandInput) {
    return await SystemUtilities.cachedFunction(
      "S3ListObjects",
      "3s",
      async () => {
        const client = await SystemUtilities.getAWSClient();
        const response = await client.send(
          new ListObjectsV2Command({
            ...additionalParams,
            Bucket: "wikisubmission",
          }),
        );

        return response;
      },
    );
  }

  static async getObject(
    key: string,
    additionalParams?: GetObjectCommandInput,
  ): Promise<GetObjectCommandOutputExtended | null> {
    try {
      const client = await SystemUtilities.getAWSClient();

      const response = await client.send(
        new GetObjectCommand({
          ...additionalParams,
          Key: key,
          Bucket: "wikisubmission",
        }),
      );

      return {
        ...response,
        Key: key,
        Extension: SystemUtilities.getFileExtension(key),
      };
    } catch {
      return this.getObjectViaLookup(key);
    }
  }

  static async uploadObjectFromURL(
    key: string,
    url: string,
    attachmentSize: number,
    attachmentContentType: string,
    additionalParams?: PutObjectCommandInput,
  ): Promise<PutObjectCommandOutputExtended | null> {
    try {
      const client = await SystemUtilities.getAWSClient();

      const response = await fetch(url);
      if (!response.ok) return null;

      const buffer = Buffer.from(await response.arrayBuffer());
      const bodyStream = Readable.from(buffer);

      const result = await client.send(
        new PutObjectCommand({
          ...additionalParams,
          Key: key,
          Bucket: "wikisubmission",
          Body: bodyStream,
          ContentLength: attachmentSize,
          ContentType: attachmentContentType,
          ACL: "public-read", // Ensure the object is public
        }),
      );

      return result.$metadata.httpStatusCode === 201
        ? {
            ...result,
            Key: key,
            Extension: SystemUtilities.getFileExtension(key),
          }
        : null;
    } catch {
      return null;
    }
  }

  static async getObjectViaLookup(
    key: string,
    additionalParams?: ListObjectsV2CommandInput,
  ): Promise<GetObjectCommandOutputExtended | null> {
    const resolvedKey = await this.lookupObjectKey(key, additionalParams);

    return resolvedKey ? this.getObject(resolvedKey) : null;
  }

  static async lookupObjectKey(
    key: string,
    additionalParams?: ListObjectsV2CommandInput,
  ): Promise<string | null> {
    return SystemUtilities.cachedFunction(
      `S3:LookupObjectKey`,
      "1s",
      async () => {
        const { Contents } = await this.listObjects({
          Prefix: `${key.split("/")[0]}`,
          Bucket: "wikisubmission",
          ...additionalParams,
        });

        const filteredKeys = Contents?.map((obj) => obj.Key).filter((k) =>
          k?.includes(key),
        );

        const sortedKeys = filteredKeys?.sort((a, b) => {
          if (a && b) {
            if (a.length !== b.length) {
              return a.length - b.length;
            }
            return a.localeCompare(b);
          }
          return 0;
        });

        const resolvedKey = sortedKeys?.[0];

        return resolvedKey || null;
      },
    );
  }
}

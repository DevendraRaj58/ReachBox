import { Client } from '@elastic/elasticsearch';
import { env } from '../config/env.js';

export interface EmailSearchDocument {
    emailId: string;
    userId: string;
    batchId: string;
    recipient: string;
    subject: string;
    body: string;
    senderId: string;
    senderAddress: string;
    status: string;
    scheduledAt: Date;
    sentAt?: Date | null;
    failedAt?: Date | null;
    attempts: number;
    createdAt: Date;
}

export const elasticClient = new Client({
    node: env.ELASTICSEARCH_URL,
});

export async function initializeElasticsearch() {
    const exists = await elasticClient.indices.exists({
        index: env.ELASTICSEARCH_INDEX,
    });

    if (exists) {
        console.log(
            `Elasticsearch index "${env.ELASTICSEARCH_INDEX}" already exists.`
        );
        return;
    }

    await elasticClient.indices.create({
        index: env.ELASTICSEARCH_INDEX,
        mappings: {
            properties: {
                emailId: { type: 'keyword' },
                userId: { type: 'keyword' },
                batchId: { type: 'keyword' },
                recipient: { type: 'keyword' },
                subject: {
                    type: 'text',
                    fields: {
                        keyword: { type: 'keyword' },
                    },
                },
                body: { type: 'text' },
                senderId: { type: 'keyword' },
                senderAddress: { type: 'keyword' },
                status: { type: 'keyword' },
                scheduledAt: { type: 'date' },
                sentAt: { type: 'date' },
                failedAt: { type: 'date' },
                attempts: { type: 'integer' },
                createdAt: { type: 'date' },
            },
        },
    });

    console.log(
        `Elasticsearch index "${env.ELASTICSEARCH_INDEX}" created.`
    );
}

export async function indexEmail(email: EmailSearchDocument) {
    try {
        const result = await elasticClient.index({
            index: env.ELASTICSEARCH_INDEX,
            id: email.emailId,
            document: email,
            refresh: 'wait_for',
        });

        console.log(
            `Elasticsearch indexed email ${email.emailId}:`,
            result.result
        );
    } catch (error) {
        console.error('Elasticsearch indexing failed:', error);
    }
}
export async function searchEmails(
    userId: string,
    query: string,
) {


    const result = await elasticClient.search<EmailSearchDocument>({
        index: env.ELASTICSEARCH_INDEX,
        size: 100,
        query: {
            bool: {
                must: query
                    ? [
                        {
                            multi_match: {
                                query,
                                fields: [
                                    'recipient',
                                    'subject',
                                    'body',
                                    'senderAddress',
                                ],
                            },
                        },
                    ]
                    : [{ match_all: {} }],
                filter: [
                    {
                        term: {
                            userId,
                        },
                    },
                ],
            },
        },
        sort: [
            {
                createdAt: {
                    order: 'desc',
                },
            },
        ],
    });



    return result.hits.hits.map((hit) => hit._source);
}
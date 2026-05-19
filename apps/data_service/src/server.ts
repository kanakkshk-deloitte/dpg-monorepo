import cors from 'cors';
import express from 'express';
import { createHash, randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PORT = Number(process.env.DATA_SERVICE_PORT ?? 8082);
const ONDC_SEARCH_URL = process.env.ONDC_SEARCH_URL ?? 'http://localhost:5001/search';
const BPP_ID = process.env.BPP_ID ?? 'bpp-network';
const BPP_URI = process.env.BPP_URI ?? 'http://bpp-network:6002';
const BAP_ID = process.env.BAP_ID ?? 'bap-network';
const BAP_URI = process.env.BAP_URI ?? `http://localhost:5002`;

// ---------------------------------------------------------------------------
// Search item shape used internally
// ---------------------------------------------------------------------------

type OnSearchCatalogItem = {
    item_id: string;
    item_network: string;
    item_domain: string;
    item_type: string;
    item_instance_url: string;
    item_schema_url: string;
    item_state: Record<string, unknown>;
    item_latitude: number | null;
    item_longitude: number | null;
    created_by: string;
    created_at: string;
    updated_at: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toText(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
}

function toNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
}

function toInteger(value: unknown): number | undefined {
    const parsed = toNumber(value);
    if (parsed === undefined) return undefined;
    const asInt = Math.trunc(parsed);
    return asInt > 0 ? asInt : undefined;
}

function asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

function getPath(obj: unknown, path: string[]): unknown {
    let current = obj;
    for (const key of path) {
        if (!isRecord(current)) return undefined;
        current = current[key];
    }
    return current;
}

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toDeterministicUuid(input: string): string {
    const hash = createHash('sha1').update(input).digest('hex');
    const part1 = hash.slice(0, 8);
    const part2 = hash.slice(8, 12);
    const part3 = `5${hash.slice(13, 16)}`;
    const variantNibble = (parseInt(hash.slice(16, 17), 16) & 0x3) | 0x8;
    const part4 = `${variantNibble.toString(16)}${hash.slice(17, 20)}`;
    const part5 = hash.slice(20, 32);
    return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

function normalizeItemId(rawId: unknown): string {
    const id = toText(rawId);
    if (!id) return randomUUID();
    if (isUuid(id)) return id;
    return toDeterministicUuid(id);
}

function firstText(state: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
        const value = toText(state[key]);
        if (value) return value;
    }
    return '';
}

function mapExperienceType(value: string): string {
    const normalized = value.toLowerCase();
    if (normalized === 'entry' || normalized === 'fresher') return 'Fresher';
    if (normalized === 'mid' || normalized === 'senior' || normalized === 'lead' || normalized === 'worked before') {
        return 'Worked before';
    }
    if (normalized === 'returning after a break') return 'Returning after a break';
    return '';
}

function mapNatureOfJob(value: string): string {
    const normalized = value.toLowerCase();
    if (normalized === 'internship') return 'Internship';
    if (normalized === 'apprenticeship') return 'Apprenticeship';
    if (normalized === 'full-time' || normalized === 'full_time' || normalized === 'fulltime') return 'Full-time';
    if (normalized === 'part-time' || normalized === 'part_time' || normalized === 'contract' || normalized === 'flexible') {
        return 'Flexible';
    }
    return '';
}

/**
 * Map a Beckn catalog item into the DPG ItemResponse shape expected by
 * /api/v1/network/item/fetch_local and /api/v1/network/item/count_local.
 */
function becknItemToDpgItem(
    becknItem: Record<string, unknown>,
    network: string,
    domain: string,
    instanceUrl: string,
    schemaUrl: string
): OnSearchCatalogItem {
    const descriptor = isRecord(becknItem.descriptor) ? becknItem.descriptor : {};
    const tags = asArray(becknItem.tags);

    // Flatten tag lists into a plain object for item_state
    const tagState: Record<string, unknown> = {};
    for (const tag of tags) {
        if (!isRecord(tag)) continue;
        const list = asArray(tag.list);
        for (const entry of list) {
            if (!isRecord(entry)) continue;
            const d = isRecord(entry.descriptor) ? entry.descriptor : {};
            const key = toText(d.name);
            const val = toText(entry.value) || entry.value;
            if (key) tagState[key] = val;
        }
    }

    const role = firstText(tagState, ['role', 'job_role', 'title']) || toText(descriptor.name);
    const city = firstText(tagState, ['city']);
    const state = firstText(tagState, ['state']);
    const location = firstText(tagState, ['jobProviderLocation', 'job_provider_location', 'location']) || [city, state].filter(Boolean).join(', ');
    const natureOfJob = mapNatureOfJob(firstText(tagState, ['natureOfJob', 'nature_of_job', 'employment_type', 'job_type']));

    const schemaState: Record<string, unknown> = {
        jobProviderName: firstText(tagState, ['jobProviderName', 'job_provider_name', 'company_name', 'companyName']),
        role,
        jobProviderLocation: location,
        hiringManagerName: firstText(tagState, ['hiringManagerName', 'hiring_manager_name']),
        hiringManagerPhoneNumber: firstText(tagState, ['hiringManagerPhoneNumber', 'hiring_manager_phone_number']),
        hiringManagerEmail: firstText(tagState, ['hiringManagerEmail', 'hiring_manager_email']),
        positions: toInteger(tagState.positions) ?? toInteger(tagState.openings),
        natureOfJob,
        stipendMin: toNumber(tagState.stipendMin ?? tagState.stipend_min),
        stipendMax: toNumber(tagState.stipendMax ?? tagState.stipend_max),
        salaryMin: toNumber(tagState.salaryMin ?? tagState.salary_min),
        salaryMax: toNumber(tagState.salaryMax ?? tagState.salary_max),
        taskRateMin: toNumber(tagState.taskRateMin ?? tagState.task_rate_min),
        taskRateMax: toNumber(tagState.taskRateMax ?? tagState.task_rate_max),
        candidateExperienceType: firstText(tagState, ['candidateExperienceType', 'candidate_experience_type'])
            || mapExperienceType(firstText(tagState, ['experience_level', 'workExperience'])),
        minEducationalInstitute: firstText(tagState, ['minEducationalInstitute', 'min_educational_institute']),
        workExperienceYears: firstText(tagState, ['workExperienceYears', 'work_experience_years']),
        lastRoleHeld: firstText(tagState, ['lastRoleHeld', 'last_role_held']) || role,
    };

    return {
        item_id: normalizeItemId(becknItem.id),
        item_network: network,
        item_domain: domain,
        item_type: 'job_posting_1.0',
        item_instance_url: instanceUrl,
        item_schema_url: schemaUrl,
        item_state: {
            ...tagState,
            ...schemaState,
            name: role || toText(descriptor.name),
            short_desc: toText(descriptor.short_desc),
            long_desc: toText(descriptor.long_desc),
        },
        item_latitude: null,
        item_longitude: null,
        created_by: 'data_service',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
}

function parseCatalogItems(
    payload: unknown,
    network: string,
    domain: string,
    instanceUrl: string,
    schemaUrl: string
): OnSearchCatalogItem[] {
    const directProviders = asArray(getPath(payload, ['message', 'catalog', 'providers']));
    const responseEntries = asArray(getPath(payload, ['responses']));
    const responseProviders = responseEntries.flatMap((entry) =>
        asArray(getPath(entry, ['message', 'catalog', 'providers']))
    );
    const providers = [...directProviders, ...responseProviders];
    const items: OnSearchCatalogItem[] = [];

    for (const provider of providers) {
        if (!isRecord(provider)) continue;
        for (const becknItem of asArray(provider.items)) {
            if (!isRecord(becknItem)) continue;
            items.push(becknItemToDpgItem(becknItem, network, domain, instanceUrl, schemaUrl));
        }
    }

    return items;
}

/**
 * Send a Beckn search request to ONDC and parse any synchronous catalog
 * returned in the response. If the ONDC gateway responds only with an ACK
 * (and expects asynchronous callbacks), this will return an empty list.
 */
async function searchViaOndc(filters: {
    item_network: string;
    item_domain: string;
    item_type?: string;
    item_state?: Record<string, unknown>;
}): Promise<OnSearchCatalogItem[]> {
    const transactionId = randomUUID();
    const messageId = randomUUID();
    const instanceUrl = `http://localhost:${PORT}`;
    const schemaUrl = `${instanceUrl}/schema/${encodeURIComponent(filters.item_network)}/${encodeURIComponent(filters.item_domain)}/job_posting_1.0`;
    const roleQuery = toText(filters.item_state?.role);
    const searchItemName = roleQuery || 'Job Search';

    const searchPayload = {
        context: {
            domain: `${filters.item_network}_job_matching`,
            action: 'search',
            version: '1.1.0',
            bap_id: BAP_ID,
            bap_uri: BAP_URI,
            bpp_id: BPP_ID,
            bpp_uri: BPP_URI,
            transaction_id: transactionId,
            message_id: messageId,
            timestamp: new Date().toISOString(),
            ttl: 'PT10M',
            location: {
                country: { name: 'India', code: 'IND' },
                city: { name: 'Bengaluru', code: 'std:080' },
            },
        },
        message: {
            intent: {
                category: { descriptor: { code: 'JOB-SEARCH' } },
                item: {
                    descriptor: {
                        name: searchItemName,
                    },
                },
                ...(filters.item_state ? {
                    tags: [
                        {
                            descriptor: { name: 'filters' },
                            list: Object.entries(filters.item_state).map(([key, value]) => ({
                                descriptor: { name: key },
                                value: String(value),
                            })),
                        },
                    ],
                } : {}),
            },
        },
    };

    try {
        const resp = await fetch(ONDC_SEARCH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(searchPayload),
        });

        console.log(`ondc_search_http_status: ${resp.status} ${resp.statusText}`);

        if (!resp.ok) {
            console.error(`ondc_search_error: HTTP ${resp.status} ${await resp.text()}`);
            return [];
        }

        const rawText = await resp.text();
        console.log('ondc_search_raw_response:', rawText);

        // Try to parse a synchronous catalog response (may be ACK only)
        const body = rawText ? JSON.parse(rawText) : {};
        const items = parseCatalogItems(
            body,
            filters.item_network,
            filters.item_domain,
            instanceUrl,
            schemaUrl
        );

        const directProvidersCount = asArray(getPath(body, ['message', 'catalog', 'providers'])).length;
        const responseEntriesCount = asArray(getPath(body, ['responses'])).length;
        const nestedProvidersCount = asArray(getPath(body, ['responses']))
            .flatMap((entry) => asArray(getPath(entry, ['message', 'catalog', 'providers']))).length;
        console.log(
            'ondc_search_parse_summary:',
            JSON.stringify({
                direct_providers_count: directProvidersCount,
                response_entries_count: responseEntriesCount,
                nested_providers_count: nestedProvidersCount,
                mapped_items_count: items.length,
                item_network: filters.item_network,
                item_domain: filters.item_domain,
            })
        );

        return items.map((item) => ({
            ...item,
            item_network: filters.item_network,
            item_domain: filters.item_domain,
            item_instance_url: instanceUrl,
            item_schema_url: schemaUrl,
        }));
    } catch (err) {
        console.error('ondc_search_fetch_error:', String(err));
        return [];
    }
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'data_service', port: PORT });
});

// ---------------------------------------------------------------------------
// DPG instance endpoints — called by apps/api inter_instance_fetch
// ---------------------------------------------------------------------------

type FetchFilters = {
    item_network: string;
    item_domain: string;
    item_type?: string;
    item_state?: Record<string, unknown>;
    limit: number;
    offset: number;
};

type CountFilters = Omit<FetchFilters, 'limit' | 'offset'>;

// POST /api/v1/network/item/count_local
app.post('/api/v1/network/item/count_local', async (req, res) => {
    const body = req.body as CountFilters;
    try {
        const items = await searchViaOndc({
            item_network: body.item_network,
            item_domain: body.item_domain,
            item_type: body.item_type,
            item_state: body.item_state,
        });
        res.json({ count: items.length });
    } catch (err) {
        console.error('count_local_error:', String(err));
        res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to count items' });
    }
});

// POST /api/v1/network/item/fetch_local
app.post('/api/v1/network/item/fetch_local', async (req, res) => {
    const body = req.body as FetchFilters;
    const limit = Math.max(1, Math.min(100, body.limit ?? 20));
    const offset = Math.max(0, body.offset ?? 0);
    try {
        const items = await searchViaOndc({
            item_network: body.item_network,
            item_domain: body.item_domain,
            item_type: body.item_type,
            item_state: body.item_state,
        });
        const page = items.slice(offset, offset + limit);
        res.json({
            meta: { total: items.length, limit, offset },
            items: page,
        });
    } catch (err) {
        console.error('fetch_local_error:', String(err));
        res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch items' });
    }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, '0.0.0.0', () => {
    console.log(`data_service started on port ${PORT}`);
    console.log(`ONDC search endpoint: ${ONDC_SEARCH_URL}`);
});

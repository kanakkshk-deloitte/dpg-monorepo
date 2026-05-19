import cors from 'cors';
import express from 'express';
import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const port = Number(process.env.MOCK_JOB_BPP_PORT ?? 8081);
const publicUrl = (process.env.MOCK_JOB_BPP_PUBLIC_URL ?? `http://localhost:${port}`).replace(/\/$/, '');

// ---------------------------------------------------------------------------
// Mock data types
// ---------------------------------------------------------------------------

type MockJob = {
    id: string;
    locationId: string;
    company_id: string;
    company_name: string;
    company_short_desc: string;
    company_long_desc: string;
    role: string;
    role_short_desc: string;
    role_long_desc: string;
    city: string;
    cityCode: string;
    state: string;
    country: string;
    countryCode: string;
    gps: string;
    employment_type: 'full_time' | 'part_time' | 'contract' | 'internship';
    salary_min: string;
    salary_max: string;
    currency: string;
    required_skills: string[];
    experience_level: 'entry' | 'mid' | 'senior' | 'lead';
    openings: number;
    hiring_manager_name: string;
    hiring_manager_phone_number: string;
    hiring_manager_email: string;
};

// ---------------------------------------------------------------------------
// Mock job catalogue — based on blue_dot_job_matching.yaml schema
// ---------------------------------------------------------------------------

const MOCK_JOBS: MockJob[] = [
    {
        id: 'job-bd-001',
        locationId: 'loc-blr-001',
        company_id: 'comp-techcorp',
        company_name: 'TechCorp India',
        company_short_desc: 'Product engineering company based in Bengaluru',
        company_long_desc:
            'TechCorp India builds enterprise SaaS products for the BFSI sector. We are a remote-first engineering team of 200+.',
        role: 'Backend Developer',
        role_short_desc: 'Build and scale backend APIs in Node.js',
        role_long_desc:
            'We are looking for a mid-level Backend Developer with 2-4 years of experience in Node.js, TypeScript, and PostgreSQL to join our platform team.',
        city: 'Bengaluru',
        cityCode: 'std:080',
        state: 'Karnataka',
        country: 'India',
        countryCode: 'IND',
        gps: '12.971599,77.594563',
        employment_type: 'full_time',
        salary_min: '800000',
        salary_max: '1500000',
        currency: 'INR',
        required_skills: ['nodejs', 'typescript', 'postgresql'],
        experience_level: 'mid',
        openings: 3,
        hiring_manager_name: 'Priya Sharma',
        hiring_manager_phone_number: '9988776655',
        hiring_manager_email: 'priya.sharma@techcorp.example',
    },
    {
        id: 'job-bd-002',
        locationId: 'loc-blr-002',
        company_id: 'comp-acmelabs',
        company_name: 'Acme Labs',
        company_short_desc: 'Deep-tech startup building AI-powered hiring tools',
        company_long_desc:
            'Acme Labs is a Series-A funded startup using AI to match the right candidate to the right role across India.',
        role: 'Backend Engineer',
        role_short_desc: 'Own the core platform services end-to-end',
        role_long_desc:
            'Seeking an experienced Backend Engineer to design, build, and maintain our high-throughput job-matching platform using Node.js, Postgres, and Redis.',
        city: 'Bengaluru',
        cityCode: 'std:080',
        state: 'Karnataka',
        country: 'India',
        countryCode: 'IND',
        gps: '12.935700,77.624100',
        employment_type: 'full_time',
        salary_min: '1800000',
        salary_max: '2400000',
        currency: 'INR',
        required_skills: ['nodejs', 'postgresql', 'redis'],
        experience_level: 'senior',
        openings: 2,
        hiring_manager_name: 'Rahul Verma',
        hiring_manager_phone_number: '9977665544',
        hiring_manager_email: 'rahul.verma@acmelabs.example',
    },
    {
        id: 'job-bd-003',
        locationId: 'loc-mum-001',
        company_id: 'comp-finbridge',
        company_name: 'FinBridge Technologies',
        company_short_desc: 'Fintech startup enabling micro-lending for SMEs',
        company_long_desc:
            'FinBridge connects SMEs with NBFCs via an open API lending platform built on modern cloud infrastructure.',
        role: 'Full Stack Developer',
        role_short_desc: 'Build product features across React and Node.js',
        role_long_desc:
            'We need a Full Stack Developer comfortable with both React (TypeScript) and server-side Node.js to build customer-facing lending flows.',
        city: 'Mumbai',
        cityCode: 'std:022',
        state: 'Maharashtra',
        country: 'India',
        countryCode: 'IND',
        gps: '19.075984,72.877656',
        employment_type: 'full_time',
        salary_min: '1000000',
        salary_max: '1800000',
        currency: 'INR',
        required_skills: ['react', 'typescript', 'nodejs'],
        experience_level: 'mid',
        openings: 4,
        hiring_manager_name: 'Neha Kapoor',
        hiring_manager_phone_number: '9966554433',
        hiring_manager_email: 'neha.kapoor@finbridge.example',
    },
    {
        id: 'job-bd-004',
        locationId: 'loc-mum-002',
        company_id: 'comp-cloudnext',
        company_name: 'CloudNext Solutions',
        company_short_desc: 'Cloud consulting and managed services firm',
        company_long_desc:
            'CloudNext helps enterprises migrate to and operate on AWS, GCP, and Azure. We are a team of certified cloud architects across India.',
        role: 'DevOps Engineer',
        role_short_desc: 'Own CI/CD pipelines and cloud infrastructure',
        role_long_desc:
            'Seeking a DevOps Engineer to manage Kubernetes clusters, design CI/CD pipelines, and ensure infrastructure reliability for our enterprise clients.',
        city: 'Mumbai',
        cityCode: 'std:022',
        state: 'Maharashtra',
        country: 'India',
        countryCode: 'IND',
        gps: '19.018200,72.847800',
        employment_type: 'contract',
        salary_min: '1200000',
        salary_max: '2000000',
        currency: 'INR',
        required_skills: ['kubernetes', 'docker', 'aws', 'terraform'],
        experience_level: 'mid',
        openings: 2,
        hiring_manager_name: 'Arjun Nair',
        hiring_manager_phone_number: '9955443322',
        hiring_manager_email: 'arjun.nair@cloudnext.example',
    },
    {
        id: 'job-bd-005',
        locationId: 'loc-del-001',
        company_id: 'comp-govtech',
        company_name: 'GovTech Ventures',
        company_short_desc: 'Government digital transformation partner',
        company_long_desc:
            'GovTech Ventures partners with central and state governments to build citizen-facing digital public goods on open standards.',
        role: 'Frontend Developer',
        role_short_desc: 'Build accessible UI for public-facing government portals',
        role_long_desc:
            'We are hiring a Frontend Developer to design and implement accessible, responsive React applications for large-scale government portals serving millions of citizens.',
        city: 'Delhi',
        cityCode: 'std:011',
        state: 'Delhi',
        country: 'India',
        countryCode: 'IND',
        gps: '28.613939,77.209023',
        employment_type: 'full_time',
        salary_min: '700000',
        salary_max: '1200000',
        currency: 'INR',
        required_skills: ['react', 'typescript', 'accessibility', 'css'],
        experience_level: 'entry',
        openings: 5,
        hiring_manager_name: 'Anita Singh',
        hiring_manager_phone_number: '9944332211',
        hiring_manager_email: 'anita.singh@govtech.example',
    },
    {
        id: 'job-bd-006',
        locationId: 'loc-del-002',
        company_id: 'comp-aiworks',
        company_name: 'AIWorks India',
        company_short_desc: 'Applied AI research and product lab',
        company_long_desc:
            'AIWorks builds production-grade LLM-powered tools for enterprise knowledge management and enterprise search.',
        role: 'Machine Learning Engineer',
        role_short_desc: 'Train and deploy ML models at scale',
        role_long_desc:
            'We need an ML Engineer with hands-on experience in fine-tuning language models, building ML pipelines with Python, and deploying models to production using cloud infrastructure.',
        city: 'Delhi',
        cityCode: 'std:011',
        state: 'Delhi',
        country: 'India',
        countryCode: 'IND',
        gps: '28.559500,77.205600',
        employment_type: 'full_time',
        salary_min: '2000000',
        salary_max: '3500000',
        currency: 'INR',
        required_skills: ['python', 'pytorch', 'llm', 'mlops'],
        experience_level: 'senior',
        openings: 1,
        hiring_manager_name: 'Karan Malhotra',
        hiring_manager_phone_number: '9933221100',
        hiring_manager_email: 'karan.malhotra@aiworks.example',
    },
    {
        id: 'job-bd-007',
        locationId: 'loc-pun-001',
        company_id: 'comp-acmelabs',
        company_name: 'Acme Labs',
        company_short_desc: 'Deep-tech startup building AI-powered hiring tools',
        company_long_desc:
            'Acme Labs is a Series-A funded startup using AI to match the right candidate to the right role across India.',
        role: 'React Developer',
        role_short_desc: 'Build the candidate-facing portal using React',
        role_long_desc:
            'We are looking for a React Developer to build our next-generation candidate portal with a clean, fast UI backed by REST APIs.',
        city: 'Pune',
        cityCode: 'std:020',
        state: 'Maharashtra',
        country: 'India',
        countryCode: 'IND',
        gps: '18.520430,73.856744',
        employment_type: 'full_time',
        salary_min: '600000',
        salary_max: '1100000',
        currency: 'INR',
        required_skills: ['react', 'javascript', 'css'],
        experience_level: 'entry',
        openings: 3,
        hiring_manager_name: 'Sneha Patil',
        hiring_manager_phone_number: '9922110099',
        hiring_manager_email: 'sneha.patil@acmelabs.example',
    },
    {
        id: 'job-bd-008',
        locationId: 'loc-hyd-001',
        company_id: 'comp-datapulse',
        company_name: 'DataPulse Analytics',
        company_short_desc: 'Data engineering and analytics consultancy',
        company_long_desc:
            'DataPulse helps enterprises unlock value from their data through modern data engineering, warehousing, and BI solutions.',
        role: 'Data Engineer',
        role_short_desc: 'Design and maintain large-scale data pipelines',
        role_long_desc:
            'Seeking a Data Engineer to build robust ingestion and transformation pipelines using Apache Spark, dbt, and BigQuery for enterprise analytics clients.',
        city: 'Hyderabad',
        cityCode: 'std:040',
        state: 'Telangana',
        country: 'India',
        countryCode: 'IND',
        gps: '17.385044,78.486671',
        employment_type: 'full_time',
        salary_min: '1000000',
        salary_max: '1800000',
        currency: 'INR',
        required_skills: ['python', 'spark', 'dbt', 'bigquery', 'sql'],
        experience_level: 'mid',
        openings: 4,
        hiring_manager_name: 'Vikram Rao',
        hiring_manager_phone_number: '9911009988',
        hiring_manager_email: 'vikram.rao@datapulse.example',
    },
];

function toNatureOfJob(value: MockJob['employment_type']): 'Internship' | 'Apprenticeship' | 'Full-time' | 'Flexible' {
    if (value === 'internship') return 'Internship';
    if (value === 'full_time') return 'Full-time';
    return 'Flexible';
}

function toCandidateExperienceType(value: MockJob['experience_level']): 'Fresher' | 'Worked before' {
    if (value === 'entry') return 'Fresher';
    return 'Worked before';
}

// ---------------------------------------------------------------------------
// Helpers — filtering
// ---------------------------------------------------------------------------

type FilterList = Array<{ key: string; value: string }>;

function extractFilters(request: Record<string, unknown>): FilterList {
    const tags = asArray(getPath(request, ['message', 'intent', 'tags']));
    const filterGroup = tags.find((tag) => {
        const descriptor = isRecord(tag) ? tag.descriptor : undefined;
        const name = isRecord(descriptor) ? String(descriptor.name ?? '') : '';
        return name.toLowerCase() === 'filters';
    });

    if (!isRecord(filterGroup)) {
        return [];
    }

    const list = asArray(filterGroup.list);
    const filters: FilterList = [];

    for (const entry of list) {
        if (!isRecord(entry)) {
            continue;
        }

        const descriptor = isRecord(entry.descriptor) ? entry.descriptor : {};
        const key = toText(descriptor.name);
        const value = toText(entry.value);

        if (key && value) {
            filters.push({ key, value });
        }
    }

    return filters;
}

function getFilterValue(filters: FilterList, ...keys: string[]): string {
    for (const key of keys) {
        const found = filters.find((f) => normalize(f.key) === normalize(key));
        if (found) {
            return found.value;
        }
    }

    return '';
}

function normalize(str: string): string {
    return (str ?? '').toLowerCase().trim();
}

function toText(value: unknown): string {
    if (typeof value === 'string') {
        return value.trim();
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    return '';
}

function isCanonicalCityCode(code: string): boolean {
    return /^std:\d+$/i.test(code.trim());
}

// ---------------------------------------------------------------------------
// Helpers — response builders
// ---------------------------------------------------------------------------

function buildJobItem(job: MockJob) {
    return {
        id: job.id,
        descriptor: {
            name: job.role,
            short_desc: job.role_short_desc,
            long_desc: job.role_long_desc,
        },
        price: {
            currency: job.currency,
            minimum_value: job.salary_min,
            maximum_value: job.salary_max,
        },
        quantity: {
            available: { count: job.openings },
        },
        category_ids: ['cat-job-search'],
        location_ids: [job.locationId],
        fulfillment_ids: ['fulfillment-online', 'fulfillment-inperson'],
        tags: [
            {
                descriptor: { name: 'job_details' },
                display: true,
                list: [
                    { descriptor: { name: 'jobProviderName' }, value: job.company_name },
                    { descriptor: { name: 'role' }, value: job.role },
                    { descriptor: { name: 'jobProviderLocation' }, value: `${job.city}, ${job.state}` },
                    { descriptor: { name: 'hiringManagerName' }, value: job.hiring_manager_name },
                    { descriptor: { name: 'hiringManagerPhoneNumber' }, value: job.hiring_manager_phone_number },
                    { descriptor: { name: 'hiringManagerEmail' }, value: job.hiring_manager_email },
                    { descriptor: { name: 'positions' }, value: String(job.openings) },
                    { descriptor: { name: 'natureOfJob' }, value: toNatureOfJob(job.employment_type) },
                    { descriptor: { name: 'salaryMin' }, value: job.salary_min },
                    { descriptor: { name: 'salaryMax' }, value: job.salary_max },
                    { descriptor: { name: 'candidateExperienceType' }, value: toCandidateExperienceType(job.experience_level) },
                    { descriptor: { name: 'lastRoleHeld' }, value: job.role },
                    { descriptor: { name: 'required_skills' }, value: job.required_skills.join(',') },
                    { descriptor: { name: 'city' }, value: job.city },
                    { descriptor: { name: 'state' }, value: job.state },
                ],
            },
        ],
    };
}

function buildProviderLocations(jobs: MockJob[]) {
    const seen = new Set<string>();
    const locations: unknown[] = [];

    for (const job of jobs) {
        if (seen.has(job.locationId)) {
            continue;
        }

        seen.add(job.locationId);
        locations.push({
            id: job.locationId,
            gps: job.gps,
            city: { name: job.city, code: job.cityCode },
            state: { name: job.state },
            country: { name: job.country, code: job.countryCode },
        });
    }

    return locations;
}

// ---------------------------------------------------------------------------
// Helpers — object utilities
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

function getPath(obj: unknown, path: string[]): unknown {
    let current = obj;

    for (const key of path) {
        if (!isRecord(current)) {
            return undefined;
        }

        current = current[key];
    }

    return current;
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'mock_job_bpp', port, jobs: MOCK_JOBS.length });
});

// Beckn BPP /search endpoint
app.post('/search', async (req, res) => {
    const request = req.body as Record<string, unknown>;
    console.log('search_request:', JSON.stringify(request));

    const context = isRecord(request.context) ? request.context : {};
    const transactionId = toText(context.transaction_id) || randomUUID();
    const messageId = toText(context.message_id) || randomUUID();

    if (!isValidUuid(transactionId) || !isValidUuid(messageId)) {
        res.status(400).json({
            message: {
                ack: { status: 'NACK' },
            },
            error: {
                code: 'INVALID_CONTEXT',
                message: 'context.transaction_id and context.message_id must be valid UUIDs',
            },
        });
        return;
    }

    const enrichedContext = {
        ...context,
        transaction_id: transactionId,
        message_id: messageId,
    };

    // Respond with ACK immediately
    res.json({ message: { ack: { status: 'ACK' } } });

    // Fire on_search callback asynchronously
    void sendOnSearch(enrichedContext, request);
});

async function sendOnSearch(
    context: Record<string, unknown>,
    request: Record<string, unknown>
): Promise<void> {
    try {
        const fetchFn = (globalThis as any).fetch;
        if (!fetchFn) throw new Error('fetch is not available in this environment');
        const filters = extractFilters(request);

        const requestCountryCode = toText(getPath(request, ['context', 'location', 'country', 'code'])) || 'IND';
        const bapId = toText(getPath(request, ['context', 'bap_id'])) || 'bap-network-2';
        const bapUri = toText(getPath(request, ['context', 'bap_uri'])) || 'http://43.204.7.40:8081';
        const bppId = toText(getPath(request, ['context', 'bpp_id'])) || publicUrl;
        const bppUri = toText(getPath(request, ['context', 'bpp_uri'])) || publicUrl;

        const filterCityCode = toText(getPath(request, ['context', 'location', 'city', 'code']))
            || getFilterValue(filters, 'city_code', 'city code');
        const filterCityName = toText(getPath(request, ['context', 'location', 'city', 'name']))
            || getFilterValue(filters, 'city_name', 'city', 'location');

        const requestCityCode = filterCityCode || 'std:080';
        const requestDomain = toText(context.domain) || 'jobmatching:oan:blue_dot';
        const incomingTtl = toText(context.ttl) || 'PT10M';
        const timestamp = new Date().toISOString();

        // Job-specific filters
        const requestedJobId = toText(getPath(request, ['message', 'intent', 'item', 'id']))
            || getFilterValue(filters, 'job_id', 'item_id');
        const requestedRoleRaw = toText(getPath(request, ['message', 'intent', 'item', 'descriptor', 'name']))
            || getFilterValue(filters, 'role', 'job_role', 'title');
        const requestedRole = ['job search', 'job_posting_1.0'].includes(normalize(requestedRoleRaw))
            ? ''
            : requestedRoleRaw;
        const filterEmploymentType = getFilterValue(filters, 'employment_type', 'job_type');
        const filterSkills = getFilterValue(filters, 'skills', 'required_skills');
        const filterExperience = getFilterValue(filters, 'experience_level', 'experience');

        // Match jobs
        let matchedJobs = MOCK_JOBS.filter((job) => {
            const jobIdMatch = !requestedJobId || normalize(job.id) === normalize(requestedJobId);
            const roleMatch = !requestedRole
                || normalize(job.role).includes(normalize(requestedRole))
                || normalize(job.company_name).includes(normalize(requestedRole));
            const cityCodeMatch = !filterCityCode
                || !isCanonicalCityCode(filterCityCode)
                || normalize(job.cityCode) === normalize(filterCityCode);
            const cityNameMatch = !filterCityName
                || normalize(job.city).includes(normalize(filterCityName));
            const employmentTypeMatch = !filterEmploymentType
                || normalize(job.employment_type) === normalize(filterEmploymentType);
            const skillsMatch = !filterSkills
                || filterSkills.split(',').some((s) => job.required_skills.some((js) => normalize(js).includes(normalize(s.trim()))));
            const experienceMatch = !filterExperience
                || normalize(job.experience_level) === normalize(filterExperience);

            return jobIdMatch && roleMatch && cityCodeMatch && cityNameMatch
                && employmentTypeMatch && skillsMatch && experienceMatch;
        });

        // Fallback: if no specific filters provided, return all
        if (!matchedJobs.length) {
            const hasExplicitFilters = Boolean(
                requestedJobId || requestedRole || filterCityCode || filterCityName
                || filterEmploymentType || filterSkills || filterExperience
            );
            matchedJobs = hasExplicitFilters ? [] : [...MOCK_JOBS];
        }

        const providerLocations = buildProviderLocations(matchedJobs);
        const providerItems = matchedJobs.map(buildJobItem);

        const onSearchPayload = {
            context: {
                domain: requestDomain,
                action: 'on_search',
                version: '1.1.0',
                bap_id: bapId,
                bap_uri: bapUri,
                bpp_id: bppId,
                bpp_uri: bppUri,
                transaction_id: toText(context.transaction_id),
                message_id: toText(context.message_id),
                timestamp,
                ttl: incomingTtl,
                location: {
                    country: { code: requestCountryCode },
                    city: { code: requestCityCode },
                },
            },
            message: {
                catalog: {
                    descriptor: { name: 'Blue Dot Job Matching Catalog' },
                    providers: [
                        {
                            id: 'blue-dot-jobs-provider',
                            descriptor: {
                                name: 'Blue Dot',
                                short_desc: 'Job matching network for India',
                                long_desc:
                                    'Blue Dot provides a decentralised open network for job matching connecting seekers with providers across India.',
                            },
                            categories: [
                                {
                                    id: 'cat-job-search',
                                    descriptor: { code: 'JOB-SEARCH', name: 'Job Search' },
                                },
                                {
                                    id: 'cat-candidate-profile',
                                    descriptor: { code: 'CANDIDATE-PROFILE', name: 'Candidate Profile' },
                                },
                            ],
                            fulfillments: [
                                { id: 'fulfillment-online', type: 'DIGITAL' },
                                { id: 'fulfillment-inperson', type: 'IN_PERSON_INTERVIEW' },
                            ],
                            locations: providerLocations,
                            items: providerItems,
                        },
                    ],
                },
            },
        };

        console.log('on_search_payload:', JSON.stringify(onSearchPayload));

        const normalizedBapUri = bapUri.replace(/\/$/, '');
        const res = await fetchFn(`${normalizedBapUri}/on_search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(onSearchPayload),
        });

        const rawText = await res.text();
        console.log('on_search_raw_response:', rawText);

        if (!res.ok) {
            console.error(`on_search_response_error: HTTP ${res.status} ${res.statusText} - ${rawText}`);
            return;
        }

        console.log('on_search_response:', rawText);
    } catch (error) {
        console.error('on_search_error:', String(error));
    }
}

// ---------------------------------------------------------------------------
// UUID validation
// ---------------------------------------------------------------------------

function isValidUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(port, '0.0.0.0', () => {
    console.log(`mock_job_bpp started on port ${port} (${publicUrl})`);
    console.log(`loaded ${MOCK_JOBS.length} mock jobs`);
});

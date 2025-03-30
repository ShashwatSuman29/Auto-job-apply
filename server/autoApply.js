import express from 'express';
import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';
import auth from './middleware/auth.js';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start a job search and application process
router.post('/start', auth, async (req, res) => {
    try {
        const { jobTitles, locations, salaryRange, excludeCompanies, includeRemote } = req.body;
        
        if (!jobTitles || !jobTitles.length || !locations || !locations.length) {
            return res.status(400).json({ error: 'Job titles and locations are required' });
        }
        
        const db = await connectToDatabase();
        
        // Create a new auto-apply session
        const session = {
            userId: req.user.id,
            status: 'running',
            jobTitles,
            locations,
            salaryRange,
            excludeCompanies,
            includeRemote,
            jobsFound: 0,
            applicationsSubmitted: 0,
            applicationsSkipped: 0,
            startTime: new Date(),
            lastUpdateTime: new Date(),
            logs: [{
                time: new Date(),
                message: 'Auto-apply session started',
                type: 'info'
            }],
            jobs: []
        };
        
        const result = await db.collection('autoApplySessions').insertOne(session);
        
        if (!result.insertedId) {
            return res.status(500).json({ error: 'Failed to create auto-apply session' });
        }
        
        // Start the scraping and application process in the background
        startAutoApplyProcess(result.insertedId.toString(), req.user.id);
        
        res.json({
            sessionId: result.insertedId.toString(),
            message: 'Auto-apply session started successfully'
        });
    } catch (error) {
        console.error('Error starting auto-apply session:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get the status of an auto-apply session
router.get('/status/:sessionId', auth, async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }
        
        const db = await connectToDatabase();
        const session = await db.collection('autoApplySessions').findOne({
            _id: new ObjectId(sessionId),
            userId: req.user.id
        });
        
        if (!session) {
            return res.status(404).json({ error: 'Auto-apply session not found' });
        }
        
        res.json(session);
    } catch (error) {
        console.error('Error getting auto-apply session status:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all auto-apply sessions for a user
router.get('/sessions', auth, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const sessions = await db.collection('autoApplySessions')
            .find({ userId: req.user.id })
            .sort({ startTime: -1 })
            .toArray();
        
        res.json(sessions);
    } catch (error) {
        console.error('Error getting auto-apply sessions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Stop an auto-apply session
router.post('/stop/:sessionId', auth, async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }
        
        const db = await connectToDatabase();
        const result = await db.collection('autoApplySessions').updateOne(
            {
                _id: new ObjectId(sessionId),
                userId: req.user.id,
                status: 'running'
            },
            {
                $set: {
                    status: 'stopped',
                    lastUpdateTime: new Date()
                },
                $push: {
                    logs: {
                        time: new Date(),
                        message: 'Auto-apply session stopped by user',
                        type: 'info'
                    }
                }
            }
        );
        
        if (result.modifiedCount === 0) {
            return res.status(400).json({ error: 'Failed to stop auto-apply session or session is not running' });
        }
        
        res.json({ message: 'Auto-apply session stopped successfully' });
    } catch (error) {
        console.error('Error stopping auto-apply session:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Fetch job listings from multiple job sites
router.get('/job-listings', auth, async (req, res) => {
    try {
        const { query, location, source } = req.query;
        
        // Log the request
        console.log(`Fetching job listings with query: ${query}, location: ${location}, source: ${source || 'all'}`);
        
        // Initialize empty array for job listings
        let jobListings = [];
        
        // Function to fetch jobs from LinkedIn
        const fetchLinkedInJobs = async () => {
            try {
                console.log('Fetching jobs from LinkedIn...');
                // In a real implementation, you would use LinkedIn API or web scraping
                // For demo purposes, we'll return mock data
                return [
                    {
                        id: `linkedin-${Date.now()}-1`,
                        title: query ? `${query} Engineer` : 'Software Engineer',
                        company: 'LinkedIn Corporation',
                        location: location || 'Bangalore, India',
                        description: 'Join our team to build scalable web applications using modern technologies.',
                        salary: '₹12,00,000 - ₹18,00,000 per year',
                        postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                        applicationUrl: 'https://linkedin.com/jobs/view',
                        source: 'LinkedIn',
                        skills: ['JavaScript', 'React', 'Node.js'],
                        jobType: 'Full-time',
                        experienceLevel: '3-5 years'
                    },
                    {
                        id: `linkedin-${Date.now()}-2`,
                        title: query ? `Senior ${query} Developer` : 'Senior Software Developer',
                        company: 'Microsoft',
                        location: location || 'Hyderabad, India',
                        description: 'Looking for experienced developers to join our cloud services team.',
                        salary: '₹20,00,000 - ₹30,00,000 per year',
                        postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                        applicationUrl: 'https://linkedin.com/jobs/view',
                        source: 'LinkedIn',
                        skills: ['C#', '.NET', 'Azure', 'Cloud Computing'],
                        jobType: 'Full-time',
                        experienceLevel: '5+ years'
                    }
                ];
            } catch (error) {
                console.error('Error fetching LinkedIn jobs:', error);
                return [];
            }
        };
        
        // Function to fetch jobs from Indeed
        const fetchIndeedJobs = async () => {
            try {
                console.log('Fetching jobs from Indeed...');
                // In a real implementation, you would use Indeed API or web scraping
                // For demo purposes, we'll return mock data
                return [
                    {
                        id: `indeed-${Date.now()}-1`,
                        title: query ? `${query} Developer` : 'Full Stack Developer',
                        company: 'TCS',
                        location: location || 'Mumbai, India',
                        description: 'We are looking for a skilled developer to join our digital transformation team.',
                        salary: '₹8,00,000 - ₹15,00,000 per year',
                        postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                        applicationUrl: 'https://indeed.com/jobs/view',
                        source: 'Indeed',
                        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
                        jobType: 'Full-time',
                        experienceLevel: '2-4 years'
                    },
                    {
                        id: `indeed-${Date.now()}-2`,
                        title: query ? `${query} Specialist` : 'DevOps Engineer',
                        company: 'Infosys',
                        location: location || 'Pune, India',
                        description: 'Join our cloud infrastructure team to build and maintain scalable systems.',
                        salary: '₹10,00,000 - ₹18,00,000 per year',
                        postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                        applicationUrl: 'https://indeed.com/jobs/view',
                        source: 'Indeed',
                        skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
                        jobType: 'Full-time',
                        experienceLevel: '3-5 years'
                    }
                ];
            } catch (error) {
                console.error('Error fetching Indeed jobs:', error);
                return [];
            }
        };
        
        // Function to fetch jobs from Internshala
        const fetchInternshalaJobs = async () => {
            try {
                console.log('Fetching jobs from Internshala...');
                // In a real implementation, you would use Internshala API or web scraping
                // For demo purposes, we'll return mock data
                return [
                    {
                        id: `internshala-${Date.now()}-1`,
                        title: query ? `${query} Intern` : 'Web Development Intern',
                        company: 'Startup Hub',
                        location: location || 'Remote',
                        description: 'Looking for passionate interns to help build our web platform.',
                        salary: '₹10,000 - ₹15,000 per month',
                        postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                        applicationUrl: 'https://internshala.com/internship/detail',
                        source: 'Internshala',
                        skills: ['HTML', 'CSS', 'JavaScript', 'React'],
                        jobType: 'Internship',
                        experienceLevel: '0-1 years'
                    },
                    {
                        id: `internshala-${Date.now()}-2`,
                        title: query ? `${query} Trainee` : 'Data Science Trainee',
                        company: 'Analytics Vidya',
                        location: location || 'Bangalore, India',
                        description: 'Join our data science team to work on real-world machine learning projects.',
                        salary: '₹15,000 - ₹20,000 per month',
                        postedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                        applicationUrl: 'https://internshala.com/internship/detail',
                        source: 'Internshala',
                        skills: ['Python', 'Machine Learning', 'Data Analysis'],
                        jobType: 'Internship',
                        experienceLevel: '0-1 years'
                    }
                ];
            } catch (error) {
                console.error('Error fetching Internshala jobs:', error);
                return [];
            }
        };
        
        // Fetch jobs based on source parameter or fetch from all sources
        if (!source || source === 'all') {
            // Fetch from all sources in parallel
            const [linkedInJobs, indeedJobs, internshalaJobs] = await Promise.all([
                fetchLinkedInJobs(),
                fetchIndeedJobs(),
                fetchInternshalaJobs()
            ]);
            
            jobListings = [...linkedInJobs, ...indeedJobs, ...internshalaJobs];
        } else {
            // Fetch from specific source
            switch (source.toLowerCase()) {
                case 'linkedin':
                    jobListings = await fetchLinkedInJobs();
                    break;
                case 'indeed':
                    jobListings = await fetchIndeedJobs();
                    break;
                case 'internshala':
                    jobListings = await fetchInternshalaJobs();
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid source parameter' });
            }
        }
        
        // Sort job listings by posted date (newest first)
        jobListings.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
        
        console.log(`Returning ${jobListings.length} job listings`);
        res.json(jobListings);
    } catch (error) {
        console.error('Error fetching job listings:', error);
        res.status(500).json({ error: 'Failed to fetch job listings' });
    }
});

// The main function that handles the auto-apply process
async function startAutoApplyProcess(sessionId, userId) {
    const db = await connectToDatabase();
    
    try {
        // Update session with progress log
        await db.collection('autoApplySessions').updateOne(
            { _id: new ObjectId(sessionId) },
            {
                $push: {
                    logs: {
                        time: new Date(),
                        message: 'Initializing browser for job search',
                        type: 'info'
                    }
                }
            }
        );
        
        // Get the session details
        const session = await db.collection('autoApplySessions').findOne({ _id: new ObjectId(sessionId) });
        
        if (!session || session.status !== 'running') {
            return;
        }
        
        // Get user profile for auto-filling applications
        const userProfile = await db.collection('profiles').findOne({ userId });
        
        if (!userProfile) {
            await updateSessionError(db, sessionId, 'User profile not found. Please complete your profile before auto-applying.');
            return;
        }
        
        // Launch browser
        const browser = await puppeteer.launch({
            headless: false, // Set to true in production
            defaultViewport: null,
            args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'],
            ignoreHTTPSErrors: true
        });
        
        try {
            // Search for jobs on LinkedIn
            await searchLinkedInJobs(browser, db, sessionId, session, userProfile);
            
            // Search for jobs on Indeed
            await searchIndeedJobs(browser, db, sessionId, session, userProfile);
            
            // Mark session as completed
            await db.collection('autoApplySessions').updateOne(
                { _id: new ObjectId(sessionId) },
                {
                    $set: {
                        status: 'completed',
                        lastUpdateTime: new Date()
                    },
                    $push: {
                        logs: {
                            time: new Date(),
                            message: 'Auto-apply session completed',
                            type: 'info'
                        }
                    }
                }
            );
        } finally {
            // Close the browser
            await browser.close();
        }
    } catch (error) {
        console.error('Error in auto-apply process:', error);
        
        // Update session with error
        await updateSessionError(db, sessionId, `Error in auto-apply process: ${error.message}`);
    }
}

// Function to search for jobs on LinkedIn
async function searchLinkedInJobs(browser, db, sessionId, session, userProfile) {
    try {
        await updateSessionLog(db, sessionId, 'Starting LinkedIn job search', 'info');
        
        const page = await browser.newPage();
        
        // Navigate to LinkedIn jobs
        await page.goto('https://www.linkedin.com/jobs/', { waitUntil: 'networkidle2' });
        
        // For each job title and location combination
        for (const jobTitle of session.jobTitles) {
            for (const location of session.locations) {
                if (await isSessionStopped(db, sessionId)) {
                    await updateSessionLog(db, sessionId, 'Session stopped by user', 'info');
                    return;
                }
                
                await updateSessionLog(db, sessionId, `Searching for ${jobTitle} in ${location}`, 'info');
                
                // Fill in job title
                await page.waitForSelector('input[aria-label="Search job titles or companies"]');
                await page.click('input[aria-label="Search job titles or companies"]', { clickCount: 3 });
                await page.keyboard.press('Backspace');
                await page.type('input[aria-label="Search job titles or companies"]', jobTitle);
                
                // Fill in location
                await page.waitForSelector('input[aria-label="Location"]');
                await page.click('input[aria-label="Location"]', { clickCount: 3 });
                await page.keyboard.press('Backspace');
                await page.type('input[aria-label="Location"]', location);
                
                // Click search button
                await page.waitForSelector('button[data-tracking-control-name="public_jobs_jobs-search-bar_base-search-button"]');
                await page.click('button[data-tracking-control-name="public_jobs_jobs-search-bar_base-search-button"]');
                
                // Wait for search results
                await page.waitForSelector('.jobs-search-results-list');
                
                // Extract job listings
                const jobListings = await page.evaluate(() => {
                    const listings = [];
                    const jobCards = document.querySelectorAll('.job-card-container');
                    
                    jobCards.forEach(card => {
                        const titleElement = card.querySelector('.job-card-list__title');
                        const companyElement = card.querySelector('.job-card-container__company-name');
                        const locationElement = card.querySelector('.job-card-container__metadata-item');
                        const linkElement = card.querySelector('.job-card-list__title');
                        
                        if (titleElement && companyElement && locationElement && linkElement) {
                            listings.push({
                                title: titleElement.textContent.trim(),
                                company: companyElement.textContent.trim(),
                                location: locationElement.textContent.trim(),
                                url: linkElement.href,
                                source: 'LinkedIn'
                            });
                        }
                    });
                    
                    return listings;
                });
                
                // Update session with found jobs
                await updateSessionWithJobs(db, sessionId, jobListings);
                
                // Apply to jobs
                for (const job of jobListings) {
                    if (await isSessionStopped(db, sessionId)) {
                        return;
                    }
                    
                    // Skip excluded companies
                    if (session.excludeCompanies && session.excludeCompanies.some(company => 
                        job.company.toLowerCase().includes(company.toLowerCase()))) {
                        await updateSessionLog(db, sessionId, `Skipping job at excluded company: ${job.company}`, 'info');
                        continue;
                    }
                    
                    await updateSessionLog(db, sessionId, `Attempting to apply for ${job.title} at ${job.company}`, 'info');
                    
                    try {
                        // Navigate to job page
                        await page.goto(job.url, { waitUntil: 'networkidle2' });
                        
                        // Check if Easy Apply button exists
                        const easyApplyButton = await page.$('button.jobs-apply-button');
                        
                        if (easyApplyButton) {
                            // Click Easy Apply
                            await easyApplyButton.click();
                            await page.waitForSelector('.jobs-easy-apply-content');
                            
                            // Fill application form (simplified - would need to be more robust in production)
                            await fillLinkedInApplication(page, userProfile);
                            
                            // Update job status
                            await updateJobStatus(db, sessionId, job.url, 'applied');
                            await updateSessionLog(db, sessionId, `Successfully applied to ${job.title} at ${job.company}`, 'success');
                            
                            // Update application count
                            await db.collection('autoApplySessions').updateOne(
                                { _id: new ObjectId(sessionId) },
                                { $inc: { applicationsSubmitted: 1 } }
                            );
                        } else {
                            await updateJobStatus(db, sessionId, job.url, 'skipped');
                            await updateSessionLog(db, sessionId, `Skipped ${job.title} at ${job.company} - No Easy Apply button`, 'warning');
                            
                            // Update skipped count
                            await db.collection('autoApplySessions').updateOne(
                                { _id: new ObjectId(sessionId) },
                                { $inc: { applicationsSkipped: 1 } }
                            );
                        }
                    } catch (error) {
                        console.error(`Error applying to job ${job.title}:`, error);
                        await updateJobStatus(db, sessionId, job.url, 'error');
                        await updateSessionLog(db, sessionId, `Error applying to ${job.title} at ${job.company}: ${error.message}`, 'error');
                        
                        // Update skipped count
                        await db.collection('autoApplySessions').updateOne(
                            { _id: new ObjectId(sessionId) },
                            { $inc: { applicationsSkipped: 1 } }
                        );
                    }
                }
            }
        }
        
        await page.close();
    } catch (error) {
        console.error('Error in LinkedIn job search:', error);
        await updateSessionLog(db, sessionId, `Error in LinkedIn job search: ${error.message}`, 'error');
    }
}

// Function to search for jobs on Indeed
async function searchIndeedJobs(browser, db, sessionId, session, userProfile) {
    try {
        await updateSessionLog(db, sessionId, 'Starting Indeed job search', 'info');
        
        const page = await browser.newPage();
        
        // Navigate to Indeed jobs
        await page.goto('https://www.indeed.com/', { waitUntil: 'networkidle2' });
        
        // For each job title and location combination
        for (const jobTitle of session.jobTitles) {
            for (const location of session.locations) {
                if (await isSessionStopped(db, sessionId)) {
                    await updateSessionLog(db, sessionId, 'Session stopped by user', 'info');
                    return;
                }
                
                await updateSessionLog(db, sessionId, `Searching for ${jobTitle} in ${location}`, 'info');
                
                // Fill in job title
                await page.waitForSelector('#text-input-what');
                await page.click('#text-input-what', { clickCount: 3 });
                await page.keyboard.press('Backspace');
                await page.type('#text-input-what', jobTitle);
                
                // Fill in location
                await page.waitForSelector('#text-input-where');
                await page.click('#text-input-where', { clickCount: 3 });
                await page.keyboard.press('Backspace');
                await page.type('#text-input-where', location);
                
                // Click search button
                await page.waitForSelector('button[type="submit"]');
                await page.click('button[type="submit"]');
                
                // Wait for search results
                await page.waitForSelector('.jobsearch-ResultsList');
                
                // Extract job listings
                const jobListings = await page.evaluate(() => {
                    const listings = [];
                    const jobCards = document.querySelectorAll('.job_seen_beacon');
                    
                    jobCards.forEach(card => {
                        const titleElement = card.querySelector('.jobTitle a');
                        const companyElement = card.querySelector('.companyName');
                        const locationElement = card.querySelector('.companyLocation');
                        
                        if (titleElement && companyElement && locationElement) {
                            listings.push({
                                title: titleElement.textContent.trim(),
                                company: companyElement.textContent.trim(),
                                location: locationElement.textContent.trim(),
                                url: titleElement.href,
                                source: 'Indeed'
                            });
                        }
                    });
                    
                    return listings;
                });
                
                // Update session with found jobs
                await updateSessionWithJobs(db, sessionId, jobListings);
                
                // Apply to jobs
                for (const job of jobListings) {
                    if (await isSessionStopped(db, sessionId)) {
                        return;
                    }
                    
                    // Skip excluded companies
                    if (session.excludeCompanies && session.excludeCompanies.some(company => 
                        job.company.toLowerCase().includes(company.toLowerCase()))) {
                        await updateSessionLog(db, sessionId, `Skipping job at excluded company: ${job.company}`, 'info');
                        continue;
                    }
                    
                    await updateSessionLog(db, sessionId, `Attempting to apply for ${job.title} at ${job.company}`, 'info');
                    
                    try {
                        // Navigate to job page
                        await page.goto(job.url, { waitUntil: 'networkidle2' });
                        
                        // Check if Apply button exists
                        const applyButton = await page.$('button[id="indeedApplyButton"]');
                        
                        if (applyButton) {
                            // Click Apply
                            await applyButton.click();
                            
                            // Wait for the application modal to load
                            await page.waitForSelector('.ia-container');
                            
                            // Fill application form (simplified - would need to be more robust in production)
                            await fillIndeedApplication(page, userProfile);
                            
                            // Update job status
                            await updateJobStatus(db, sessionId, job.url, 'applied');
                            await updateSessionLog(db, sessionId, `Successfully applied to ${job.title} at ${job.company}`, 'success');
                            
                            // Update application count
                            await db.collection('autoApplySessions').updateOne(
                                { _id: new ObjectId(sessionId) },
                                { $inc: { applicationsSubmitted: 1 } }
                            );
                        } else {
                            await updateJobStatus(db, sessionId, job.url, 'skipped');
                            await updateSessionLog(db, sessionId, `Skipped ${job.title} at ${job.company} - No Apply button`, 'warning');
                            
                            // Update skipped count
                            await db.collection('autoApplySessions').updateOne(
                                { _id: new ObjectId(sessionId) },
                                { $inc: { applicationsSkipped: 1 } }
                            );
                        }
                    } catch (error) {
                        console.error(`Error applying to job ${job.title}:`, error);
                        await updateJobStatus(db, sessionId, job.url, 'error');
                        await updateSessionLog(db, sessionId, `Error applying to ${job.title} at ${job.company}: ${error.message}`, 'error');
                        
                        // Update skipped count
                        await db.collection('autoApplySessions').updateOne(
                            { _id: new ObjectId(sessionId) },
                            { $inc: { applicationsSkipped: 1 } }
                        );
                    }
                }
            }
        }
        
        await page.close();
    } catch (error) {
        console.error('Error in Indeed job search:', error);
        await updateSessionLog(db, sessionId, `Error in Indeed job search: ${error.message}`, 'error');
    }
}

// Helper function to fill LinkedIn application forms
async function fillLinkedInApplication(page, userProfile) {
    try {
        // This is a simplified version - real implementation would need to handle various form types
        
        // Check if there are multiple steps
        const nextButton = await page.$('button[aria-label="Continue to next step"]');
        
        if (nextButton) {
            // Fill first page (usually contact info)
            const nameInput = await page.$('input[id*="first-name"]');
            if (nameInput) {
                await nameInput.type(userProfile.name.split(' ')[0]);
            }
            
            const lastNameInput = await page.$('input[id*="last-name"]');
            if (lastNameInput) {
                await lastNameInput.type(userProfile.name.split(' ').slice(1).join(' '));
            }
            
            const emailInput = await page.$('input[id*="email"]');
            if (emailInput) {
                await emailInput.type(userProfile.email);
            }
            
            // Click next
            await nextButton.click();
            await page.waitForTimeout(1000);
            
            // Handle additional steps (simplified)
            while (await page.$('button[aria-label="Continue to next step"]')) {
                const continueButton = await page.$('button[aria-label="Continue to next step"]');
                await continueButton.click();
                await page.waitForTimeout(1000);
            }
            
            // Submit application
            const submitButton = await page.$('button[aria-label="Submit application"]');
            if (submitButton) {
                await submitButton.click();
                await page.waitForTimeout(2000);
            }
        } else {
            // Single step application
            const submitButton = await page.$('button[aria-label="Submit application"]');
            if (submitButton) {
                await submitButton.click();
                await page.waitForTimeout(2000);
            }
        }
    } catch (error) {
        console.error('Error filling LinkedIn application:', error);
        throw error;
    }
}

// Helper function to fill Indeed application forms
async function fillIndeedApplication(page, userProfile) {
    try {
        // This is a simplified version - real implementation would need to handle various form types
        
        // Switch to the application iframe
        const applicationFrame = await page.$('.ia-iframe');
        if (applicationFrame) {
            const frame = await applicationFrame.contentFrame();
            
            // Fill name
            const nameInput = await frame.$('input[id*="name"]');
            if (nameInput) {
                await nameInput.type(userProfile.name);
            }
            
            // Fill email
            const emailInput = await frame.$('input[id*="email"]');
            if (emailInput) {
                await emailInput.type(userProfile.email);
            }
            
            // Upload resume if needed
            const resumeUpload = await frame.$('input[type="file"]');
            if (resumeUpload && userProfile.resumeUrl) {
                const resumePath = path.join(__dirname, '../uploads', userProfile.resumeUrl);
                await resumeUpload.uploadFile(resumePath);
                await page.waitForTimeout(2000);
            }
            
            // Continue through application steps
            while (await frame.$('button[type="submit"]')) {
                const continueButton = await frame.$('button[type="submit"]');
                await continueButton.click();
                await page.waitForTimeout(2000);
            }
        }
    } catch (error) {
        console.error('Error filling Indeed application:', error);
        throw error;
    }
}

// Helper function to update session log
async function updateSessionLog(db, sessionId, message, type) {
    await db.collection('autoApplySessions').updateOne(
        { _id: new ObjectId(sessionId) },
        {
            $push: {
                logs: {
                    time: new Date(),
                    message,
                    type
                }
            },
            $set: {
                lastUpdateTime: new Date()
            }
        }
    );
}

// Helper function to update session with error
async function updateSessionError(db, sessionId, errorMessage) {
    await db.collection('autoApplySessions').updateOne(
        { _id: new ObjectId(sessionId) },
        {
            $set: {
                status: 'error',
                lastUpdateTime: new Date()
            },
            $push: {
                logs: {
                    time: new Date(),
                    message: errorMessage,
                    type: 'error'
                }
            }
        }
    );
}

// Helper function to update session with found jobs
async function updateSessionWithJobs(db, sessionId, jobListings) {
    // Get current session to check for duplicate jobs
    const session = await db.collection('autoApplySessions').findOne({ _id: new ObjectId(sessionId) });
    const existingJobUrls = session.jobs.map(job => job.url);
    
    // Filter out duplicate jobs
    const newJobs = jobListings.filter(job => !existingJobUrls.includes(job.url));
    
    if (newJobs.length > 0) {
        // Add status field to each job
        const jobsWithStatus = newJobs.map(job => ({
            ...job,
            status: 'found',
            foundAt: new Date()
        }));
        
        // Update session with new jobs
        await db.collection('autoApplySessions').updateOne(
            { _id: new ObjectId(sessionId) },
            {
                $push: {
                    jobs: { $each: jobsWithStatus }
                },
                $inc: {
                    jobsFound: jobsWithStatus.length
                },
                $set: {
                    lastUpdateTime: new Date()
                }
            }
        );
        
        await updateSessionLog(db, sessionId, `Found ${jobsWithStatus.length} new jobs`, 'info');
    }
}

// Helper function to update job status
async function updateJobStatus(db, sessionId, jobUrl, status) {
    await db.collection('autoApplySessions').updateOne(
        { 
            _id: new ObjectId(sessionId),
            'jobs.url': jobUrl
        },
        {
            $set: {
                'jobs.$.status': status,
                'jobs.$.updatedAt': new Date(),
                lastUpdateTime: new Date()
            }
        }
    );
}

// Helper function to check if session has been stopped
async function isSessionStopped(db, sessionId) {
    const session = await db.collection('autoApplySessions').findOne({ _id: new ObjectId(sessionId) });
    return !session || session.status !== 'running';
}

export default router;

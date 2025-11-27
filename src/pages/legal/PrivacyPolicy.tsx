import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useOutletContext } from 'react-router';
import { LegalLayoutContextType } from '../../components/layout/LegalLayout';

export const PrivacyPolicy = () => {
    const currentDate = new Date().toISOString().split('T')[0];
    const { setTocItems } = useOutletContext<LegalLayoutContextType>();

    const sections = [
        { id: 'section-1', title: '1. Introduction' },
        { id: 'section-2', title: '2. Information We Collect' },
        { id: 'section-3', title: '3. How We Use Your Information' },
        { id: 'section-4', title: '4. Data Storage and Security' },
        { id: 'section-5', title: '5. Data Sharing and Disclosure' },
        { id: 'section-6', title: '6. Your Rights and Choices' },
        { id: 'section-7', title: '7. Children\'s Privacy' },
        { id: 'section-8', title: '8. International Users' },
        { id: 'section-9', title: '9. California Privacy Rights' },
        { id: 'section-10', title: '10. Cookies and Tracking' },
        { id: 'section-11', title: '11. Changes to Policy' },
        { id: 'section-12', title: '12. Third-Party Links' },
        { id: 'section-13', title: '13. Data Breach Procedures' },
        { id: 'section-14', title: '14. Contact Information' },
        { id: 'section-15', title: '15. Consent' },
        { id: 'section-16', title: '16. Acknowledgment' },
    ];

    // Pass TOC items to the layout's sidebar
    useEffect(() => {
        setTocItems(sections);
        return () => setTocItems([]);
    }, [setTocItems]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center">
            <div className="w-full max-w-5xl space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
                </div>

                {/* Main Content */}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="text-center text-xl">PRIVACY POLICY</CardTitle>
                        <p className="text-center text-lg font-medium text-muted-foreground">Light Suvara - Sunday School Management App</p>
                        <div className="text-center text-sm text-muted-foreground mt-2">
                            <p>Last Updated: {currentDate}</p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8 pr-4">
                            <section id="section-1" className="scroll-mt-24">
                                <h3 className="text-lg font-bold mb-4 border-b pb-2">1. INTRODUCTION</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Welcome to Light Suvara ("we," "our," or "us"). We are committed to protecting
                                    your privacy and ensuring the security of your personal information. This
                                    Privacy Policy explains how we collect, use, disclose, and safeguard your
                                    information when you use our mobile application "Light Suvara" (the "App").
                                </p>
                                <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                                    Light Suvara is a Sunday School management application designed to serve
                                    Christian Mission League (CML) and SUVARA organizations. We take your privacy
                                    seriously and are transparent about our data practices.
                                </p>
                                <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                                    By using our App, you agree to the collection and use of information in
                                    accordance with this Privacy Policy. If you do not agree with our policies and
                                    practices, please do not use our App.
                                </p>
                            </section>

                            <section id="section-2" className="scroll-mt-24">
                                <h3 className="text-lg font-bold mb-4 border-b pb-2">2. INFORMATION WE COLLECT</h3>

                                <h4 className="font-semibold mt-4 mb-2">2.1 PERSONAL INFORMATION</h4>
                                <p className="text-sm text-muted-foreground mb-2">When you register and use Light Suvara, we may collect the following personal information:</p>
                                <div className="ml-4">
                                    <p className="text-sm font-medium mt-2">Account Information:</p>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground ml-2">
                                        <li>Email address (required for authentication)</li>
                                        <li>Password (encrypted, not stored in plain text)</li>
                                        <li>Full name (optional, can be added in profile)</li>
                                        <li>Phone number (optional, can be added in profile)</li>
                                    </ul>
                                    <p className="text-sm font-medium mt-2">Profile Information:</p>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground ml-2">
                                        <li>School/Organization name</li>
                                        <li>Organization affiliation (CML or SUVARA)</li>
                                        <li>User role (User or Admin)</li>
                                        <li>Profile picture (if uploaded)</li>
                                    </ul>
                                </div>

                                <h4 className="font-semibold mt-4 mb-2">2.2 USAGE INFORMATION</h4>
                                <p className="text-sm text-muted-foreground mb-2">We automatically collect certain information when you use our App:</p>
                                <div className="ml-4">
                                    <p className="text-sm font-medium mt-2">Event Interactions:</p>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground ml-2">
                                        <li>Events you view</li>
                                        <li>Search queries</li>
                                        <li>Event categories you access</li>
                                        <li>Time spent viewing events</li>
                                    </ul>
                                    <p className="text-sm font-medium mt-2">App Usage:</p>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground ml-2">
                                        <li>Features accessed</li>
                                        <li>Navigation patterns</li>
                                        <li>App session duration</li>
                                        <li>Error logs (for debugging purposes)</li>
                                    </ul>
                                    <p className="text-sm font-medium mt-2">Device Information:</p>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground ml-2">
                                        <li>Device type and model</li>
                                        <li>Operating system version</li>
                                        <li>Unique device identifiers</li>
                                        <li>App version</li>
                                    </ul>
                                </div>

                                <h4 className="font-semibold mt-4 mb-2">2.3 CONTENT YOU CREATE</h4>
                                <p className="text-sm text-muted-foreground mb-2">If you are an Admin user, we collect:</p>
                                <div className="ml-4">
                                    <p className="text-sm font-medium mt-2">Event Data:</p>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground ml-2">
                                        <li>Event titles and descriptions</li>
                                        <li>Event dates and locations</li>
                                        <li>Event categories (CML/SUVARA)</li>
                                        <li>Event images and media files</li>
                                    </ul>
                                    <p className="text-sm font-medium mt-2">Notifications:</p>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground ml-2">
                                        <li>Broadcast messages you send</li>
                                        <li>Notification content</li>
                                        <li>Target audience information</li>
                                    </ul>
                                </div>

                                <h4 className="font-semibold mt-4 mb-2">2.4 AUTOMATICALLY COLLECTED INFORMATION</h4>
                                <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
                                    <li>IP address (for security and analytics)</li>
                                    <li>Device identifiers</li>
                                    <li>Crash reports and error logs</li>
                                    <li>Performance metrics</li>
                                </ul>
                            </section>

                            <section id="section-3" className="scroll-mt-24">
                                <h3 className="text-lg font-bold mb-4 border-b pb-2">3. HOW WE USE YOUR INFORMATION</h3>
                                <p className="text-sm text-muted-foreground mb-2">We use the collected information for the following purposes:</p>

                                <div className="space-y-3 ml-4">
                                    <div>
                                        <p className="text-sm font-semibold">3.1 SERVICE DELIVERY</p>
                                        <ul className="list-disc list-inside text-sm text-muted-foreground ml-2">
                                            <li>To provide and maintain Light Suvara functionality</li>
                                            <li>To authenticate your account and manage access</li>
                                            <li>To deliver event information and notifications</li>
                                            <li>To enable event management features (for admins)</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">3.2 PERSONALIZATION</p>
                                        <ul className="list-disc list-inside text-sm text-muted-foreground ml-2">
                                            <li>To customize your event feed based on your organization</li>
                                            <li>To remember your preferences and settings</li>
                                            <li>To provide relevant event recommendations</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">3.3 COMMUNICATION</p>
                                        <ul className="list-disc list-inside text-sm text-muted-foreground ml-2">
                                            <li>To send push notifications about new events</li>
                                            <li>To respond to your inquiries and support requests</li>
                                            <li>To send important updates about the App</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">3.4 IMPROVEMENT AND ANALYTICS</p>
                                        <ul className="list-disc list-inside text-sm text-muted-foreground ml-2">
                                            <li>To analyze app usage patterns</li>
                                            <li>To improve app performance and user experience</li>
                                            <li>To identify and fix technical issues</li>
                                            <li>To develop new features</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">3.5 SECURITY</p>
                                        <ul className="list-disc list-inside text-sm text-muted-foreground ml-2">
                                            <li>To protect against unauthorized access</li>
                                            <li>To prevent fraud and abuse</li>
                                            <li>To enforce our terms of service</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            <section id="section-4" className="scroll-mt-24">
                                <h3 className="text-lg font-bold mb-4 border-b pb-2">4. DATA STORAGE AND SECURITY</h3>

                                <h4 className="font-semibold mt-4 mb-2">4.1 DATA STORAGE</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Light Suvara uses Firebase, Google's mobile and web application development platform, 
                                    for data storage and authentication. Your data is stored on secure servers provided by 
                                    Firebase/Google Cloud Platform.
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
                                    <li>Authentication data is managed by Firebase Authentication</li>
                                    <li>User profiles and event data are stored in Cloud Firestore</li>
                                    <li>Images and media files are stored in Firebase Cloud Storage</li>
                                    <li>Data is encrypted both in transit and at rest</li>
                                </ul>

                                <h4 className="font-semibold mt-4 mb-2">4.2 SECURITY MEASURES</h4>
                                <p className="text-sm text-muted-foreground mb-2">We implement various security measures including:</p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
                                    <li>SSL/TLS encryption for all data transmission</li>
                                    <li>Secure password storage using industry-standard hashing</li>
                                    <li>Regular security audits and updates</li>
                                    <li>Access controls and authentication mechanisms</li>
                                    <li>Firestore security rules to protect user data</li>
                                </ul>

                                <h4 className="font-semibold mt-4 mb-2">4.3 DATA RETENTION</h4>
                                <p className="text-sm text-muted-foreground">
                                    We retain your information only as long as necessary to provide our services 
                                    and fulfill the purposes outlined in this Privacy Policy. You may request 
                                    deletion of your account and associated data at any time.
                                </p>
                            </section>

                            <section id="section-5" className="scroll-mt-24">
                                <h3 className="text-lg font-bold mb-4 border-b pb-2">5. DATA SHARING AND DISCLOSURE</h3>

                                <h4 className="font-semibold mt-4 mb-2">5.1 WE DO NOT SELL YOUR DATA</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Light Suvara does not sell, rent, or trade your personal information to third 
                                    parties for marketing purposes.
                                </p>

                                <h4 className="font-semibold mt-4 mb-2">5.2 SERVICE PROVIDERS</h4>
                                <p className="text-sm text-muted-foreground mb-2">We share data with the following service providers:</p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
                                    <li>Firebase/Google Cloud Platform (hosting and authentication)</li>
                                    <li>Cloud infrastructure providers</li>
                                    <li>Analytics services (if applicable)</li>
                                </ul>

                                <h4 className="font-semibold mt-4 mb-2">5.3 LEGAL REQUIREMENTS</h4>
                                <p className="text-sm text-muted-foreground">
                                    We may disclose your information if required by law, court order, or government 
                                    request, or to protect our rights and safety.
                                </p>
                            </section>

                            <section id="section-6" className="scroll-mt-24">
                                <h3 className="text-lg font-bold mb-4 border-b pb-2">6. YOUR RIGHTS AND CHOICES</h3>

                                <h4 className="font-semibold mt-4 mb-2">6.1 ACCESS AND CORRECTION</h4>
                                <p className="text-sm text-muted-foreground">
                                    You can access and update your profile information directly through the App's 
                                    settings.
                                </p>

                                <h4 className="font-semibold mt-4 mb-2">6.2 ACCOUNT DELETION</h4>
                                <p className="text-sm text-muted-foreground">
                                    You may request deletion of your account by contacting us. This will permanently 
                                    remove your personal data from our systems.
                                </p>

                                <h4 className="font-semibold mt-4 mb-2">6.3 NOTIFICATION PREFERENCES</h4>
                                <p className="text-sm text-muted-foreground">
                                    You can control push notification settings through your device settings or the 
                                    App's notification preferences.
                                </p>

                                <h4 className="font-semibold mt-4 mb-2">6.4 DATA PORTABILITY</h4>
                                <p className="text-sm text-muted-foreground">
                                    You have the right to request a copy of your personal data in a structured, 
                                    machine-readable format.
                                </p>
                            </section>

                            <section id="section-7" className="scroll-mt-24">
                                <h3 className="text-lg font-bold mb-4 border-b pb-2">7. CHILDREN'S PRIVACY</h3>
                                <p className="text-sm text-muted-foreground">
                                    Light Suvara is designed for Sunday School management and may contain information 
                                    about minors enrolled in Sunday School programs. However, the App itself is 
                                    intended for use by adults (18 years or older) such as teachers, administrators, 
                                    and parents. We do not knowingly collect personal information directly from 
                                    children under 13 without parental consent.
                                </p>
                            </section>

                            <section id="section-8" className="scroll-mt-24">
                                <h3 className="text-lg font-bold mb-4 border-b pb-2">8. INTERNATIONAL USERS</h3>
                                <p className="text-sm text-muted-foreground">
                                    Light Suvara is primarily designed for users in [Your Region/Country]. If you 
                                    access the App from other locations, your information may be transferred to and 
                                    processed in countries where our service providers operate. By using the App, 
                                    you consent to such transfers.
                                </p>
                            </section>

                            <section id="section-9" className="scroll-mt-24">
                                <h3 className="text-lg font-bold mb-4 border-b pb-2">9. CALIFORNIA PRIVACY RIGHTS</h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    If you are a California resident, you have additional rights under the California 
                                    Consumer Privacy Act (CCPA):
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
                                    <li>Right to know what personal information is collected</li>
                                    <li>Right to know if personal information is sold or disclosed</li>
                                    <li>Right to say no to the sale of personal information</li>
                                    <li>Right to access your personal information</li>
                                    <li>Right to equal service and price</li>
                                </ul>
                            </section>

                            <section id="section-10" className="scroll-mt-24">
                                <h3 className="text-lg font-bold mb-4 border-b pb-2">10. COOKIES AND TRACKING</h3>
                                <p className="text-sm text-muted-foreground">
                                    Light Suvara may use cookies and similar tracking technologies to enhance user 
                                    experience and collect usage data. You can control cookie settings through your 
                                    device or browser settings.
                                </p>
                            </section>

                            <section id="section-11" className="scroll-mt-24">
                                <h3 className="text-lg font-bold mb-4 border-b pb-2">11. CHANGES TO THIS PRIVACY POLICY</h3>
                                <p className="text-sm text-muted-foreground">
                                    We may update this Privacy Policy from time to time. When we make changes, we will:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 mt-2">
                                    <li>Update the "Last Updated" date at the top of this policy</li>
                                    <li>Notify you through the App or via email</li>
                                    <li>Require your acceptance if changes are significant</li>
                                </ul>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Continued use of the App after changes constitutes acceptance of the updated policy.
                                </p>
                            </section>

                            <section id="section-12" className="scroll-mt-24">
                                <h3 className="text-lg font-bold mb-4 border-b pb-2">12. THIRD-PARTY LINKS</h3>
                                <p className="text-sm text-muted-foreground">
                                    The App may contain links to external websites or services. We are not responsible 
                                    for the privacy practices of these third parties. We encourage you to review their 
                                    privacy policies.
                                </p>
                            </section>

                            <section id="section-13" className="scroll-mt-24">
                                <h3 className="text-lg font-bold mb-4 border-b pb-2">13. DATA BREACH PROCEDURES</h3>
                                <p className="text-sm text-muted-foreground">
                                    In the event of a data breach that affects your personal information, we will:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 mt-2">
                                    <li>Notify affected users within 72 hours of discovery</li>
                                    <li>Inform relevant authorities as required by law</li>
                                    <li>Take immediate steps to secure our systems</li>
                                    <li>Provide guidance on protective measures you can take</li>
                                </ul>
                            </section>

                            <section id="section-14" className="scroll-mt-24">
                                <h3 className="text-lg font-bold mb-4 border-b pb-2">14. CONTACT INFORMATION</h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    If you have questions, concerns, or requests regarding this Privacy Policy or 
                                    your personal data, please contact us:
                                </p>
                                <div className="bg-muted p-4 rounded-lg mt-4">
                                    <p className="text-sm font-medium">Light Suvara Support</p>
                                    <p className="text-sm text-muted-foreground mt-1">Email: [Your Contact Email]</p>
                                    <p className="text-sm text-muted-foreground">Phone: [Your Contact Phone]</p>
                                    <p className="text-sm text-muted-foreground">Address: [Your Physical Address]</p>
                                </div>
                            </section>

                            <section id="section-15" className="scroll-mt-24">
                                <h3 className="text-lg font-bold mb-4 border-b pb-2">15. CONSENT</h3>
                                <p className="text-sm text-muted-foreground">
                                    By using Light Suvara, you consent to our Privacy Policy and agree to its terms. 
                                    If you do not agree with this policy, please do not use our App.
                                </p>
                            </section>

                            <section id="section-16" className="scroll-mt-24">
                                <h3 className="text-lg font-bold mb-4 border-b pb-2">16. ACKNOWLEDGMENT</h3>
                                <div className="bg-muted p-4 rounded-lg">
                                    <p className="text-sm text-muted-foreground">
                                        This Privacy Policy was last updated on {currentDate}. By continuing to use 
                                        Light Suvara after this date, you acknowledge that you have read, understood, 
                                        and agree to be bound by this Privacy Policy.
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        For the most current version of this Privacy Policy, please check within the 
                                        App or contact us directly.
                                    </p>
                                </div>
                            </section>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

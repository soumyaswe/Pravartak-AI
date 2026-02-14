import { getVertexAIModel, generateWithFallback as vertexGenerateWithFallback } from '@/lib/vertex-ai';
import { NextResponse } from 'next/server';

import { validateAndFilterLinks, validateAndFilterLinksWithReplacement } from '@/lib/url-validator';

// Vertex AI configuration (retry and fallback built into vertex-ai utility)

const FICTIONAL_CAREERS_BLOCKLIST = [
  'jedi', 'wizard', 'dragon rider', 'superhero', 'hobbit', 'elf',
  'vampire hunter', 'time lord', 'starfleet'
];

/**
 * Recursively validates and filters URLs in roadmap node content
 * Enhanced with YouTube video replacement for unavailable videos
 * @param {Object} node - The roadmap node
 * @param {boolean} replaceYouTube - Whether to attempt YouTube replacement (default: true)
 * @returns {Promise<Object>} - Updated node with validated URLs
 */
async function validateNodeUrls(node, replaceYouTube = true) {
  if (!node) return node;

  // Validate URLs in contentFile if it exists
  if (node.contentFile && typeof node.contentFile === 'string') {
    try {
      // Use replacement logic for YouTube videos
      const { validatedText, originalCount, validCount, replacedCount } = 
        await validateAndFilterLinksWithReplacement(node.contentFile, replaceYouTube);
      
      node.contentFile = validatedText;
      
      // Log validation stats
      if (originalCount > 0) {
        const replacedInfo = replacedCount > 0 ? ` (${replacedCount} replaced)` : '';
        console.log(`Node "${node.label}": ${validCount}/${originalCount} URLs validated${replacedInfo}`);
      }
    } catch (error) {
      console.error(`Error validating URLs for node "${node.label}":`, error);
      // Keep original content on error
    }
  }

  // Recursively validate children
  if (Array.isArray(node.children)) {
    node.children = await Promise.all(
      node.children.map(child => validateNodeUrls(child, replaceYouTube))
    );
  }

  return node;
}

/**
 * Validates all URLs in the roadmap structure
 * @param {Object} roadmapData - The complete roadmap data
 * @returns {Promise<Object>} - Updated roadmap with validated URLs
 */
async function validateRoadmapUrls(roadmapData) {
  if (!roadmapData || !roadmapData.roadmap) {
    return roadmapData;
  }

  console.log('Starting URL validation for roadmap...');
  const startTime = Date.now();

  try {
    // Handle both tree format (single root node) and array format (legacy)
    if (Array.isArray(roadmapData.roadmap)) {
      // Legacy array format - validate each stage
      roadmapData.roadmap = await Promise.all(
        roadmapData.roadmap.map(async (stage) => {
          // Each stage might have steps with descriptions
          if (stage.steps && Array.isArray(stage.steps)) {
            // Validate URLs in step descriptions if needed
            // (Current format doesn't have URLs in steps, but future-proofing)
          }
          return stage;
        })
      );
    } else {
      // New tree format - recursively validate nodes
      roadmapData.roadmap = await validateNodeUrls(roadmapData.roadmap);
    }

    const duration = Date.now() - startTime;
    console.log(`URL validation completed in ${duration}ms`);
  } catch (error) {
    console.error('Error during roadmap URL validation:', error);
    // Return original data on error - better to have unvalidated links than crash
  }

  return roadmapData;
}

function generateCareerSpecificFallback(career) {
  const careerLower = career.toLowerCase();
  
  // Technology & Software
  if (careerLower.includes('developer') || careerLower.includes('engineer') || careerLower.includes('programmer')) {
    return {
      career: career,
      roadmap: {
        id: "start",
        label: "Begin Your Journey",
        contentFile: `Welcome to your ${career} roadmap! This comprehensive path will guide you from beginner to professional. Software development is a rewarding career with endless opportunities for growth and innovation.\n\nYou'll learn programming fundamentals, master essential tools, and build real-world projects. The tech industry values continuous learning, so embrace challenges and stay curious.\n\nLet's start building your future in technology!\n\n**Resources:**\n- [freeCodeCamp](https://www.freecodecamp.org/) — Interactive course\n- [The Odin Project](https://www.theodinproject.com/) — Curriculum guide\n- [CS50 - Harvard](https://cs50.harvard.edu/) — Online course`,
        children: [
          {
            id: "programming-fundamentals",
            label: "Programming Fundamentals",
            contentFile: "Master the core concepts that every developer needs. Learn variables, data types, control structures (if/else, loops), functions, and object-oriented programming principles.\n\nUnderstand how to break down problems, write clean code, and debug effectively. These fundamentals apply across all programming languages and are essential for your career.\n\nPractice with small projects like calculators, simple games, or automation scripts to solidify your understanding.\n\n**Resources:**\n- [Programming Basics - CS50](https://www.youtube.com/watch?v=8mAITcNt710) — YouTube video\n- [Learn Programming Basics - freeCodeCamp](https://www.freecodecamp.org/news/learn-programming-basics/) — Free article\n- [Codecademy](https://www.codecademy.com/) — Interactive platform",
            children: [
              {
                id: "data-structures-algorithms",
                label: "Data Structures & Algorithms",
                contentFile: "Learn essential data structures like arrays, linked lists, stacks, queues, trees, and graphs. Understand their use cases and performance characteristics.\n\nMaster common algorithms for sorting, searching, and problem-solving. Practice coding challenges on platforms like LeetCode or HackerRank to sharpen your skills.\n\nThese concepts are crucial for technical interviews and writing efficient code in production environments.\n\n**Resources:**\n- [Data Structures - freeCodeCamp](https://www.youtube.com/watch?v=RBSGKlAvoiM) — YouTube video\n- [LeetCode](https://leetcode.com/) — Practice platform\n- [Introduction to Algorithms (CLRS)](https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/) — Book",
                children: [
                  {
                    id: "version-control",
                    label: "Version Control (Git)",
                    contentFile: "Git is the industry standard for tracking code changes and collaborating with teams. Learn basic commands (clone, add, commit, push, pull) and branching strategies.\n\nUnderstand how to resolve merge conflicts, create pull requests, and follow collaborative workflows. GitHub or GitLab will be your portfolio platform.\n\nEvery professional developer uses version control daily - it's non-negotiable for modern software development.\n\n**Resources:**\n- [Git Tutorial - Traversy Media](https://www.youtube.com/watch?v=SWYqp7iY_Tc) — YouTube video\n- [Pro Git Book](https://git-scm.com/book/en/v2) — Free book\n- [GitHub Skills](https://skills.github.com/) — Interactive tutorial",
                    children: [
                      {
                        id: "frameworks-libraries",
                        label: "Frameworks & Libraries",
                        contentFile: "Master popular frameworks and libraries relevant to your specialization. For web: React, Angular, or Vue. For backend: Node.js, Django, or Spring.\n\nLearn how to leverage existing tools to build applications faster and more efficiently. Understand framework conventions, best practices, and ecosystem.\n\nBuild several projects using different frameworks to discover which tools you enjoy working with most.\n\n**Resources:**\n- [React - Net Ninja](https://www.youtube.com/watch?v=j942wKiXFu8&list=PL4cUxeGkcC9gZD-Tvwfod2gaISzfRiP9d) — YouTube playlist\n- [Official React Docs](https://react.dev/) — Official Docs\n- [Node.js Crash Course](https://www.youtube.com/watch?v=fBNz5xF-Kx4) — YouTube video",
                        children: [
                          {
                            id: "professional-development",
                            label: "Career Readiness",
                            contentFile: "Build an impressive portfolio with 3-5 polished projects showcasing different skills. Create a strong GitHub profile and LinkedIn presence.\n\nContribute to open-source projects to gain real-world experience and network with other developers. Practice explaining your technical decisions clearly.\n\nPrepare for interviews, apply strategically, and continue learning throughout your career. The journey never truly ends in tech!\n\n**Resources:**\n- [Portfolio Tips - Fireship](https://www.youtube.com/watch?v=u-RLu_8kwA0) — YouTube video\n- [Tech Interview Handbook](https://www.techinterviewhandbook.org/) — Free interview guide\n- [Good First Issue](https://goodfirstissue.dev/) — Open source finder",
                            children: []
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    };
  }
  
  // Data & Analytics
  else if (careerLower.includes('data') || careerLower.includes('scientist') || careerLower.includes('analyst')) {
    return {
      career: career,
      roadmap: {
        id: "start",
        label: "Start Data Journey",
        contentFile: `Begin your career in ${career}! Data professionals are in high demand across all industries. You'll learn to extract insights from data, build predictive models, and drive business decisions.\n\nThis field combines statistics, programming, and domain knowledge. You'll work with massive datasets, cutting-edge AI tools, and solve real-world problems.\n\nThe journey requires strong analytical thinking and continuous learning as the field evolves rapidly.\n\n**Resources:**\n- [Data Science Path - Kaggle](https://www.kaggle.com/learn) — Interactive tutorials\n- [StatQuest - Josh Starmer](https://www.youtube.com/c/joshstarmer) — YouTube channel\n- [Towards Data Science](https://towardsdatascience.com/) — Blog articles`,
        children: [
          {
            id: "statistics-foundation",
            label: "Statistics & Math",
            contentFile: "Master statistics and probability theory - the foundation of all data work. Learn descriptive statistics, probability distributions, hypothesis testing, and statistical inference.\n\nUnderstand concepts like correlation, regression, p-values, confidence intervals, and experimental design. These are essential for making data-driven decisions.\n\nPractice with real datasets and learn to interpret results correctly - this is where many data projects succeed or fail.\n\n**Resources:**\n- [Statistics Fundamentals - StatQuest](https://www.youtube.com/playlist?list=PLblh5JKOoLUK0FLuzwntyYI10UQFUhsY9) — YouTube playlist\n- [Khan Academy Statistics](https://www.khanacademy.org/math/statistics-probability) — Interactive course\n- [Think Stats (free book)](https://greenteapress.com/thinkstats/) — Free book",
            children: [
              {
                id: "programming-python",
                label: "Python/R Programming",
                contentFile: "Learn Python or R for data analysis. Python is more versatile, while R excels at statistical computing. Master data manipulation libraries like pandas, NumPy, and data visualization with matplotlib or ggplot2.\n\nUnderstand how to clean messy data, handle missing values, and perform exploratory data analysis. Write efficient, readable code following best practices.\n\nBuild analysis scripts and automate repetitive data tasks to save time and reduce errors.\n\n**Resources:**\n- [Python for Data Science - freeCodeCamp](https://www.youtube.com/watch?v=LHBE6Q9XlzI) — YouTube video\n- [Pandas Documentation](https://pandas.pydata.org/docs/) — Official Docs\n- [Python Data Science Handbook](https://jakevdp.github.io/PythonDataScienceHandbook/) — Free book",
                children: [
                  {
                    id: "machine-learning",
                    label: "Machine Learning",
                contentFile: "Study supervised and unsupervised learning algorithms. Master regression, classification, clustering, and dimensionality reduction techniques using scikit-learn or similar libraries.\n\nLearn feature engineering, model selection, cross-validation, and evaluation metrics. Understand when to use which algorithm and how to tune hyperparameters.\n\nWork on projects like house price prediction, customer segmentation, or fraud detection to apply your knowledge.\n\n**Resources:**\n- [Machine Learning - Andrew Ng (Coursera)](https://www.coursera.org/learn/machine-learning) — Online course\n- [Scikit-learn Tutorials](https://scikit-learn.org/stable/tutorial/index.html) — Official Docs\n- [Machine Learning Crash Course - Google](https://developers.google.com/machine-learning/crash-course) — Free course",
                    children: [
                      {
                        id: "career-portfolio",
                        label: "Build Portfolio",
                        contentFile: "Create a portfolio of data projects showcasing end-to-end analysis skills. Include projects with real datasets, clear visualizations, and actionable insights.\n\nLearn cloud platforms (AWS, GCP, Azure) and deployment tools. Understand MLOps basics for productionizing models. Share your work on GitHub and write blog posts explaining your approach.\n\nNetwork with data professionals, attend meetups, and stay updated with the latest tools and techniques in this fast-evolving field.\n\n**Resources:**\n- [Data Science Portfolio Tips](https://www.youtube.com/watch?v=xrhPjE7wHas) — YouTube video\n- [Made With ML](https://madewithml.com/) — Tutorial website\n- [Kaggle Competitions](https://www.kaggle.com/competitions) — Competition platform",
                        children: []
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    };
  }
  
  // Design & Creative
  else if (careerLower.includes('design') || careerLower.includes('ui') || careerLower.includes('ux') || careerLower.includes('graphic')) {
    return {
      career: career,
      roadmap: {
        id: "start",
        label: "Begin Design Path",
        contentFile: `Welcome to your ${career} journey! Design is about solving problems creatively while making experiences beautiful and intuitive. You'll learn to balance aesthetics with functionality.\n\nDesigners are crucial in creating products people love to use. Whether digital or physical, good design makes the complex simple and delightful.\n\nThis creative field requires both artistic sensibility and analytical thinking. Let's build your design expertise!\n\n**Resources:**\n- [The Futur](https://www.youtube.com/c/thefutur) — YouTube channel\n- [Design Resources for Developers](https://github.com/bradtraversy/design-resources-for-developers) — GitHub repo\n- [Refactoring UI](https://www.refactoringui.com/) — Design guide`,
        children: [
          {
            id: "design-fundamentals",
            label: "Design Principles",
            contentFile: "Master core design principles: balance, contrast, hierarchy, alignment, proximity, and repetition. Learn color theory, typography basics, and composition.\n\nUnderstand how visual elements guide user attention and create emotional responses. Study great designs and analyze what makes them effective.\n\nPractice by creating simple designs daily - posters, logos, or UI mockups. Develop your eye for good design through constant observation and iteration.\n\n**Resources:**\n- [Design Principles - The Futur](https://www.youtube.com/watch?v=a5KYlHNKQB8) — YouTube video\n- [Laws of UX](https://lawsofux.com/) — Design principles\n- [Hack Design](https://hackdesign.org/lessons) — Free design course",
            children: [
              {
                id: "design-tools",
                label: "Master Design Tools",
                contentFile: "Learn industry-standard tools like Figma, Adobe XD, Sketch, or Illustrator/Photoshop. Figma is currently the most popular for UI/UX with excellent collaboration features.\n\nUnderstand layers, components, constraints, and prototyping. Learn keyboard shortcuts to work efficiently. Explore plugin ecosystems to enhance your workflow.\n\nCreate increasingly complex designs as you master the tools. Speed and efficiency come with practice and muscle memory.\n\n**Resources:**\n- [Figma Tutorial - DesignCourse](https://www.youtube.com/watch?v=FTFaQWZBqQ8) — YouTube video\n- [Figma Official Resources](https://www.figma.com/resources/learn-design/) — Official Docs\n- [Adobe XD Daily Creative Challenge](https://www.adobe.com/products/xd/learn/design-systems.html) — Tutorial series",
                children: [
                  {
                    id: "user-research",
                    label: "User Research & Testing",
                    contentFile: "Learn to conduct user interviews, surveys, and usability testing. Understand user personas, journey maps, and pain point analysis.\n\nGood design is based on real user needs, not assumptions. Learn to gather and interpret user feedback to make data-driven design decisions.\n\nPractice empathy - put yourself in users' shoes. Test your designs with real users and iterate based on their feedback.\n\n**Resources:**\n- [UX Research Methods - NNGroup](https://www.nngroup.com/articles/which-ux-research-methods/) — Article\n- [Google UX Design Certificate](https://www.coursera.org/professional-certificates/google-ux-design) — Online course\n- [UX Design Fundamentals - Udacity](https://www.udacity.com/course/intro-to-the-design-of-everyday-things--design101) — Free course",
                    children: [
                      {
                        id: "portfolio-career",
                        label: "Professional Portfolio",
                        contentFile: "Build a compelling portfolio showcasing 5-8 of your best projects. Include case studies explaining your design process, challenges faced, and solutions implemented.\n\nCreate a personal brand with a strong online presence. Network with other designers, contribute to design communities, and stay updated with trends.\n\nApply for positions or freelance work. Keep learning - design trends, tools, and best practices evolve constantly. Your learning never stops!\n\n**Resources:**\n- [Portfolio Tips - Flux Academy](https://www.youtube.com/watch?v=c5qqw0eGMnw) — YouTube video\n- [Behance](https://www.behance.net/) — Portfolio platform\n- [Designer Hangout Community](https://www.designerhangout.co/) — Community",
                        children: []
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    };
  }
  
  // Healthcare & Medical
  else if (careerLower.includes('doctor') || careerLower.includes('nurse') || careerLower.includes('medical') || careerLower.includes('physician') || careerLower.includes('healthcare')) {
    return {
      career: career,
      roadmap: [
        { title: "Education Foundation", steps: ["Complete required pre-med courses", "Maintain strong GPA", "Gain healthcare volunteer experience", "Prepare for entrance exams", "Apply to professional schools"] },
        { title: "Professional Training", steps: ["Complete degree program", "Gain clinical experience", "Pass licensing exams", "Complete residency/internship", "Pursue specialization if desired"] },
        { title: "Career Establishment", steps: ["Obtain necessary licenses", "Build professional network", "Join professional organizations", "Pursue continuing education", "Consider subspecialties"] }
      ]
    };
  }
  
  // Business & Finance
  else if (careerLower.includes('business') || careerLower.includes('finance') || careerLower.includes('accounting') || careerLower.includes('marketing') || careerLower.includes('manager')) {
    return {
      career: career,
      roadmap: [
        { title: "Business Foundation", steps: ["Complete business education", "Learn industry fundamentals", "Develop analytical skills", "Gain internship experience", "Build professional network"] },
        { title: "Skill Development", steps: ["Master relevant tools and software", "Develop leadership skills", "Gain practical experience", "Pursue certifications", "Build industry expertise"] },
        { title: "Career Growth", steps: ["Take on leadership roles", "Expand professional network", "Pursue advanced education (MBA)", "Develop strategic thinking", "Mentor others"] }
      ]
    };
  }
  
  // Teaching & Education
  else if (careerLower.includes('teacher') || careerLower.includes('professor') || careerLower.includes('educator') || careerLower.includes('instructor')) {
    return {
      career: career,
      roadmap: [
        { title: "Educational Foundation", steps: ["Complete teaching degree", "Specialize in subject area", "Complete student teaching", "Pass certification exams", "Understand pedagogy"] },
        { title: "Teaching Practice", steps: ["Gain classroom experience", "Develop curriculum", "Master classroom management", "Use educational technology", "Pursue continuing education"] },
        { title: "Professional Growth", steps: ["Pursue advanced degrees", "Take on leadership roles", "Mentor new teachers", "Publish educational content", "Join professional organizations"] }
      ]
    };
  }
  
  // Law & Legal
  else if (careerLower.includes('lawyer') || careerLower.includes('attorney') || careerLower.includes('legal') || careerLower.includes('paralegal')) {
    return {
      career: career,
      roadmap: [
        { title: "Legal Education", steps: ["Complete undergraduate degree", "Prepare for and take LSAT", "Apply to law schools", "Complete law degree", "Gain legal internships"] },
        { title: "Bar Preparation", steps: ["Study for bar exam", "Pass bar exam", "Complete ethics requirements", "Gain practical experience", "Choose practice area"] },
        { title: "Legal Career", steps: ["Build case experience", "Develop client relationships", "Join legal organizations", "Pursue specializations", "Consider partnership or opening practice"] }
      ]
    };
  }
  
  // Arts & Entertainment
  else if (careerLower.includes('artist') || careerLower.includes('musician') || careerLower.includes('actor') || careerLower.includes('writer') || careerLower.includes('photographer')) {
    return {
      career: career,
      roadmap: [
        { title: "Skill Development", steps: ["Master your craft", "Study techniques and theory", "Practice consistently", "Learn from mentors", "Build foundational skills"] },
        { title: "Portfolio Building", steps: ["Create professional portfolio", "Develop unique style", "Complete diverse projects", "Gain public exposure", "Network in industry"] },
        { title: "Professional Career", steps: ["Market yourself effectively", "Build client base", "Pursue opportunities", "Collaborate with others", "Continuously evolve artistically"] }
      ]
    };
  }
  
  // Engineering (Non-Software)
  else if (careerLower.includes('civil') || careerLower.includes('mechanical') || careerLower.includes('electrical') || careerLower.includes('chemical')) {
    return {
      career: career,
      roadmap: [
        { title: "Engineering Education", steps: ["Complete engineering degree", "Master mathematics and physics", "Learn CAD and design tools", "Gain internship experience", "Pass FE exam"] },
        { title: "Professional Experience", steps: ["Work under licensed engineer", "Gain practical experience", "Learn industry standards", "Prepare for PE exam", "Build technical expertise"] },
        { title: "Professional Engineer", steps: ["Obtain PE license", "Lead engineering projects", "Mentor junior engineers", "Pursue specializations", "Stay updated with technology"] }
      ]
    };
  }
  
  // Trades & Technical
  else if (careerLower.includes('electrician') || careerLower.includes('plumber') || careerLower.includes('carpenter') || careerLower.includes('mechanic') || careerLower.includes('technician')) {
    return {
      career: career,
      roadmap: [
        { title: "Training & Apprenticeship", steps: ["Complete trade school or vocational training", "Find apprenticeship program", "Learn safety procedures", "Master basic techniques", "Understand industry codes"] },
        { title: "Journeyman Level", steps: ["Complete apprenticeship hours", "Pass journeyman exam", "Gain diverse experience", "Build professional reputation", "Continue learning"] },
        { title: "Master Level", steps: ["Pursue master certification", "Start own business or supervise", "Mentor apprentices", "Stay updated with codes", "Expand service offerings"] }
      ]
    };
  }
  
  // Science & Research
  else if (careerLower.includes('scientist') || careerLower.includes('researcher') || careerLower.includes('biologist') || careerLower.includes('chemist') || careerLower.includes('physicist')) {
    return {
      career: career,
      roadmap: [
        { title: "Academic Foundation", steps: ["Complete science degree", "Gain lab experience", "Learn research methodology", "Develop analytical skills", "Pursue graduate education"] },
        { title: "Research Development", steps: ["Complete advanced degree", "Conduct original research", "Publish findings", "Attend conferences", "Build research network"] },
        { title: "Professional Career", steps: ["Secure research position", "Lead research projects", "Mentor students", "Pursue grants and funding", "Contribute to field advancement"] }
      ]
    };
  }
  
  // Generic fallback for any other career
  else {
    return {
      career: career,
      roadmap: {
        id: "start",
        label: "Career Start",
        contentFile: `Welcome to your ${career} career roadmap! Every successful career begins with learning the fundamentals and building practical experience. This path will guide you from beginner to professional.\n\nWhile every career has unique requirements, the core principles remain the same: continuous learning, practical application, and professional networking.\n\nLet's build a strong foundation and progressively develop your expertise in ${career}!\n\n**Resources:**\n- [LinkedIn Learning](https://www.linkedin.com/learning/) — Course platform\n- [Coursera](https://www.coursera.org/) — Online courses\n- [edX](https://www.edx.org/) — University courses`,
        children: [
          {
            id: "education-foundation",
            label: "Education & Foundation",
            contentFile: `Complete the required education and certifications for ${career}. Research the typical educational path - whether it's a degree, vocational training, or self-study.\n\nLearn the fundamental concepts, terminology, and principles that form the basis of this career. Build a strong theoretical foundation before diving into practical work.\n\nConnect with professionals in the field to understand current industry standards and expectations. Join relevant communities and forums.\n\n**Resources:**\n- [Industry-specific online courses](https://www.coursera.org/) — Online courses\n- [Professional associations and certifications](https://www.linkedin.com/) — Networking platform\n- [Reddit career communities](https://www.reddit.com/) — Community forums`,
            children: [
              {
                id: "skill-development",
                label: "Skill Development",
                contentFile: `Develop the core competencies required for ${career}. Focus on both technical skills and soft skills like communication, problem-solving, and time management.\n\nWork on practical projects to apply your knowledge. Seek internships, volunteer opportunities, or entry-level positions to gain real-world experience.\n\nFind a mentor who can guide your development and provide industry insights. Learn from their experiences and mistakes.\n\n**Resources:**\n- [Skillshare](https://www.skillshare.com/) — Creative courses\n- [YouTube educational channels](https://www.youtube.com/) — Video tutorials\n- [Udemy courses](https://www.udemy.com/) — Online courses`,
                children: [
                  {
                    id: "professional-growth",
                    label: "Professional Growth",
                    contentFile: `Build a professional portfolio showcasing your best work. Pursue advanced certifications or specialized training to stand out in your field.\n\nExpand your professional network through industry events, conferences, and online communities. Build relationships that can lead to opportunities.\n\nStay current with industry trends and continuously update your skills. Take on leadership roles and mentor others as you grow in your career.\n\n**Resources:**\n- [Professional networking on LinkedIn](https://www.linkedin.com/) — Networking platform\n- [Industry conferences and events](https://www.eventbrite.com/) — Event finder\n- [Continuous learning platforms](https://www.udacity.com/) — Tech courses`,
                    children: []
                  }
                ]
              }
            ]
          }
        ]
      }
    };
  }
}

const SYSTEM_PROMPT = `
You are an expert career counselor. Your task is to generate a structured career roadmap for a given profession as a flowchart-compatible tree structure.
You MUST provide the output as a clean JSON object, without any surrounding text or markdown.

The roadmap should be a tree structure where each node represents a learning milestone or skill.
IMPORTANT: Design the tree structure to be displayed in a clean horizontal-vertical grid layout:
- Limit each level to 2-4 child nodes for optimal horizontal spacing
- Ensure balanced distribution of nodes across levels
- Keep the tree depth between 4-6 levels for visual clarity
- Siblings at the same level will be displayed horizontally in a grid

Each node should have:
- id: A unique string identifier (use kebab-case, e.g., "learn-html", "frontend-basics-1")
- label: The title/name of this milestone (e.g., "Learn HTML", "Master JavaScript")
- contentFile: A markdown-formatted string (1-3 paragraphs) describing this topic, why it's important, and what you'll learn. IMPORTANT: Include a "Resources:" section at the end with 2-3 relevant learning resource links. Format each resource as a bullet point with a descriptive label indicating the type of resource (YouTube video, Blog article, Official Docs, Free tutorial, Free course, etc.). CRITICAL: Only include FREE and OPEN-SOURCE resources. Use credible sources like YouTube (freeCodeCamp, Fireship, Traversy Media, Tech With Tim), official documentation, free online courses (Coursera free tier, edX, Khan Academy), or reputable free learning platforms (MDN, W3Schools, freeCodeCamp articles). Never include paid books or premium course links. Make sure resources are specific to the topic and vary for each node.
- children: An array of child nodes that come after this one (can be empty for leaf nodes). LIMIT to 2-4 children per node for clean grid layout.

Here is an example of the required structure:
{
  "career": "Frontend Developer",
  "roadmap": {
    "id": "start",
    "label": "Start Your Journey",
    "contentFile": "Welcome to the Frontend Developer roadmap! This journey will take you from complete beginner to job-ready frontend developer. You'll learn how to build beautiful, interactive websites and applications that millions of people can use.\\n\\nFrontend development is one of the most accessible tech careers, with high demand and great salary potential. Let's begin with the fundamentals and progressively build your skills.\\n\\nRemember: consistency is key. Dedicate time daily, build projects, and don't be afraid to make mistakes!\\n\\n**Resources:**\\n- [freeCodeCamp Frontend Path](https://www.freecodecamp.org/learn) — Interactive course\\n- [The Odin Project](https://www.theodinproject.com/) — Curriculum guide\\n- [Frontend Roadmap by roadmap.sh](https://roadmap.sh/frontend) — Learning path",
    "children": [
      {
        "id": "html-basics",
        "label": "HTML Fundamentals",
        "contentFile": "HTML (HyperText Markup Language) is the backbone of all web pages. It provides the structure and content of websites using elements like headings, paragraphs, links, images, and forms.\\n\\nYou'll learn about semantic HTML, proper document structure, accessibility basics, and how to create well-organized web pages. Master elements like div, span, header, nav, main, footer, and form elements.\\n\\nPractice by building simple static pages like a personal portfolio, a blog layout, or a product landing page.\\n\\n**Resources:**\\n- [HTML Crash Course - Traversy Media](https://www.youtube.com/watch?v=UB1O30fR-EE) — YouTube video\\n- [MDN HTML Docs](https://developer.mozilla.org/en-US/docs/Web/HTML) — Official Docs\\n- [HTML in 100 Seconds - Fireship](https://www.youtube.com/watch?v=ok-plXXHlWw) — YouTube video",
        "children": [
          {
            "id": "css-basics",
            "label": "CSS Styling",
            "contentFile": "CSS (Cascading Style Sheets) brings life to your HTML by adding colors, layouts, animations, and responsive design. Learn selectors, the box model, flexbox, grid, and CSS variables.\\n\\nYou'll master positioning, typography, colors, gradients, shadows, and transitions to create beautiful user interfaces. Understanding responsive design with media queries is crucial for modern web development.\\n\\nBuild styled versions of your HTML projects, experimenting with different layouts and color schemes.\\n\\n**Resources:**\\n- [CSS Complete Course - freeCodeCamp](https://www.youtube.com/watch?v=OXGznpKZ_sA) — YouTube video\\n- [CSS Tricks](https://css-tricks.com/) — Blog & tutorials\\n- [Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) — Tutorial article",
            "children": [
              {
                "id": "javascript-basics",
                "label": "JavaScript Fundamentals",
                "contentFile": "JavaScript makes websites interactive and dynamic. Learn variables, data types, functions, loops, conditionals, and DOM manipulation to control page behavior.\\n\\nYou'll understand event handling, asynchronous programming, fetch API, and ES6+ features like arrow functions, destructuring, and promises.\\n\\nCreate interactive projects like a to-do list, calculator, weather app, or quiz game to practice your skills.\\n\\n**Resources:**\\n- [JavaScript Tutorial - Programming with Mosh](https://www.youtube.com/watch?v=W6NZfCO5SIk) — YouTube video\\n- [JavaScript.info](https://javascript.info/) — Tutorial website\\n- [You Don't Know JS (book series)](https://github.com/getify/You-Dont-Know-JS) — Free book",
                "children": []
              }
            ]
          }
        ]
      }
    ]
  }
}

Important guidelines:
- Create a logical progression from beginner to advanced
- Each node's contentFile should be 1-3 informative paragraphs in markdown format
- Use \\n\\n for paragraph breaks in the contentFile
- LIMIT branching: prefer 2-4 children per node for clean horizontal grid layout
- Balance the tree: distribute nodes evenly across levels
- Keep node labels concise (2-5 words)
- Make IDs unique and descriptive (use kebab-case)
- Aim for 4-6 depth levels with 2-4 nodes per level
- Don't generate roadmaps for fictional careers
- IMPORTANT: All resource links MUST be free and open-source. Never include paid content or books behind paywalls.

Ensure the roadmap is comprehensive, practical, and covers key skills, technologies, and milestones for the given career while maintaining a clean, grid-friendly structure.
`;

export async function POST(request) {
  let career = '';
  
  try {
    console.log('Roadmap API called');
    
    let body;
    try {
      body = await request.json();
      console.log('Request body parsed:', body);
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    career = body.career;
    console.log('Career requested:', career);

    if (!career || typeof career !== 'string') {
      console.error('Invalid career input:', career);
      return NextResponse.json(
        { error: 'Career input is required and must be a string' },
        { status: 400 }
      );
    }

    // Check for fictional careers
    const userInputLower = career.toLowerCase();
    const isFictional = FICTIONAL_CAREERS_BLOCKLIST.some(keyword => 
      new RegExp(`\\b${keyword}\\b`).test(userInputLower)
    );

    if (isFictional) {
      return NextResponse.json(
        { error: 'I can only generate roadmaps for real-world careers. Please enter a valid profession.' },
        { status: 400 }
      );
    }

    const fullPrompt = `${SYSTEM_PROMPT}\n\nPlease generate a roadmap for the career: '${career}'`;
    
    console.log('Sending request to Vertex AI...');
    const result = await vertexGenerateWithFallback(fullPrompt);
    const text = result.response.candidates[0].content.parts[0].text;
    console.log('Received response from Vertex AI');

    // Clean the response
    const cleanedResponse = text.trim();
    const jsonText = cleanedResponse
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    console.log('Cleaned JSON text:', jsonText.substring(0, 200) + '...');

    let roadmapData;
    try {
      roadmapData = JSON.parse(jsonText);
      console.log('JSON parsed successfully');
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', text);
      return NextResponse.json(
        { error: 'AI response was not in valid JSON format. Please try again.' },
        { status: 500 }
      );
    }

    // Validate the structure (new tree format)
    if (!roadmapData.roadmap || typeof roadmapData.roadmap !== 'object' || !roadmapData.roadmap.id) {
      console.error('Invalid roadmap structure:', roadmapData);
      return NextResponse.json(
        { error: 'Invalid roadmap structure received from AI' },
        { status: 500 }
      );
    }

    // Validate that the root node has required fields
    const rootNode = roadmapData.roadmap;
    if (!rootNode.label || !rootNode.contentFile || !Array.isArray(rootNode.children)) {
      console.error('Invalid root node structure:', rootNode);
      return NextResponse.json(
        { error: 'Invalid node structure in roadmap' },
        { status: 500 }
      );
    }

    // Validate and filter resource URLs
    console.log('Validating resource URLs in roadmap...');
    roadmapData = await validateRoadmapUrls(roadmapData);

    console.log('Roadmap generated successfully for:', career);
    return NextResponse.json({ success: true, data: roadmapData });

  } catch (error) {
    console.error('Roadmap generation error:', error);
    console.error('Error details:', {
      message: error.message,
      is503: error.message?.includes('503'),
      isOverloaded: error.message?.includes('overloaded'),
      isQuota: error.message?.includes('quota')
    });
    
    // Fallback for quota exceeded, overload, or other API errors
    if (error.message?.includes('quota') || error.message?.includes('limit') || 
        error.message?.includes('503') || error.message?.includes('overloaded') ||
        error.message?.includes('All models failed')) {
      console.log('⚠️ Using fallback roadmap due to API unavailability');
      const fallbackData = generateCareerSpecificFallback(career);
      // Validate URLs in fallback data
      const validatedFallback = await validateRoadmapUrls(fallbackData);
      return NextResponse.json({
        success: true,
        data: validatedFallback,
        usingFallback: true,
        message: 'AI service temporarily unavailable. Showing standard roadmap.'
      });
    }

    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}
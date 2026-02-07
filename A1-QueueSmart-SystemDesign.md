TableLine (QueueSmart) – Smart Queue Management Web Application 
Assignment 1: Initial Thoughts and System Design (A1)
Project Focus: Restaurant Waitlist + Table Management

TableLine is a web application designed for restaurants to manage walk-in waitlists and seating more smoothly. Guests can join a waitlist from their phone, track their position, and get notified when their table is almost ready. Hosts and managers can create services (like standard seating vs large parties), manage the queue in real time, and track basic wait time and usage trends.

**1. Initial Thoughts
Who are the main users of the system?**

Guest (User)

- Joins a restaurant waitlist

- Tracks their position and estimated wait time

- Receives notifications when they’re close to being seated

- Views their waitlist history

Administrator (Host / Manager)

- Creates and manages services (seating types)

- Monitors the active waitlist and table flow

- Adjusts priorities and handles no-shows

- Views basic usage statistics (busy hours, average wait time)

How will users and administrators interact with the application?

Guest experience (web app)
- Guests use the TableLine web app on their phone (or a QR code at the host stand). After logging in, they choose a service (ex: “Standard Seating” or “Large Party 6+”), enter party size, and join the waitlist. They then see their position and estimated wait. They receive a notification when they’re getting close, and their status updates as the host moves the line forward.

Admin experience (web app)
- Admins use a web dashboard (host stand tablet/laptop). They create services, set expected service duration, and assign default priorities. From a live queue dashboard, they can mark parties as seated, remove no-shows, change priority, and pause the queue if the restaurant is overwhelmed. They can also view basic stats to understand patterns and improve staffing decisions.

What are the most important features?

For a useful first version, the most important features are:

- Login + registration (guests and admins)

- User roles (guest vs admin permissions)

- Service management (admin creates seating services with duration + priority)

- Queue actions (guest can join/leave; admin can manage queue)

- Queue status (position + estimated wait time)

- Notifications (in-app and/or email)

- History (guest history + admin usage stats)

What challenges do you anticipate?

- Wait time accuracy: Restaurants don’t have consistent service times. Wait time depends on table turnover, party size, and no-shows, so estimates need to update often.

- Notification timing: If we notify too early, guests get annoyed. Too late, they miss their turn. We need a simple a way where that is more accurate.

- Fairness vs priority: Sometimes a host needs to prioritize (accessibility needs, VIP, etc.). The system should support priority without making the queue feel random.

- Real-time updates: Queue changes should update quickly on both guest and admin screens.

- No-shows: If a guest doesn’t respond, the system needs a “grace period” and an easy way to remove them.

**2. Development Methodology**
Which methodology will you follow?

- We plan to use an Agile approach (Scrum-style iterations).

Why is this methodology appropriate?

- Agile fits because this project has a lot of moving parts (guest flow, admin tools, notifications, wait time rules), and our understanding will improve as we design UI (A2), define APIs (A3), and create the data model (A4). Agile lets us build in steps and adjust as we go, instead of locking everything upfront.

How will this approach help across multiple assignments?

Each assignment naturally becomes a “checkpoint” that builds on the last one:

- A1: overall design and architecture (this doc)

- A2: web UI pages and flows (guest + admin)

- A3: API design (how the UI talks to the backend)

- A4: database design (users, services, queue entries, history)

- Final: working system + demo

**3. High-Level Design / Architecture**

TableLine will be designed as a web-based queue and table-management system with two main user interfaces: a guest interface and an administrator dashboard. Both interfaces interact with a centralized application server that manages authentication, queue operations, service configuration, and wait-time estimation. The system runs in real time so that changes made by administrators are immediately reflected for guests viewing their queue status.

At a high level, the system consists of four main components: a web front-end, a backend application server, a database, and an external notification service. Guests use the web interface to join a waitlist, check their position, and receive updates. Administrators use a dashboard to create services, manage the queue, adjust priorities, and mark parties as seated or removed.

The backend server handles login and registration, enforces user roles, processes queue actions, calculates estimated wait times, and stores history. A database stores users, services, queue entries, and usage statistics. An external notification service sends alerts when a guest’s table is close to being ready. Guests and administrators interact only with the web interface while the backend processes requests and updates the system in real time.


We’ll use GitHub issues to break tasks into user stories, and commits/pull requests to show each person’s contribution.

Team COntributions for A1:
Team Contributions (IMPORTANT)
## Team Contributions
| Name | Contribution | Notes |
- Ishita Uddarraju |  Led the initial system design and documentation by drafting the Initial Thoughts, Development Methodology, and High-Level Architecture sections. Answered all required assignment questions after discussing design decisions with the team. | No notes.
- Chan-Vu Nguyen | Wrote and added the High-Level Architecture section (Part 3) and committed updates to the system design document on GitHub. | No notes. |
- Huxley Taganahan | Created the system context diagram and reorganized the document | No notes. |
- Kevin Su | Created the github and assisted on the diagram | No notes. |

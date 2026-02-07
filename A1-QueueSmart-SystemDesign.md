[ds assignment1 graph2.drawio](https://github.com/user-attachments/files/25142189/ds.assignment1.graph2.drawio)TableLine (QueueSmart) – Smart Queue Management Web Application 
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

[Uploading ds assign<mxfile host="app.diagrams.net" agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0" version="29.3.8">
  <diagram name="Page-1" id="HFJPwGJyvzeSd0ka49w9">
    <mxGraphModel dx="1554" dy="823" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="stsY131Qkb1uQlxCJsp2-1" parent="1" style="whiteSpace=wrap;strokeWidth=2;" value="TableLine System Boundary" vertex="1">
          <mxGeometry height="152" width="400" x="20" y="172" as="geometry" />
        </mxCell>
        <mxCell id="stsY131Qkb1uQlxCJsp2-2" parent="1" style="rounded=1;arcSize=20;strokeWidth=2" value="Guest / User" vertex="1">
          <mxGeometry height="54" width="121" x="120" y="20" as="geometry" />
        </mxCell>
        <mxCell id="stsY131Qkb1uQlxCJsp2-3" parent="1" style="rounded=1;arcSize=20;strokeWidth=2" value="Administrator / Staff" vertex="1">
          <mxGeometry height="54" width="180" x="310" y="20" as="geometry" />
        </mxCell>
        <mxCell id="stsY131Qkb1uQlxCJsp2-4" parent="1" style="rounded=1;arcSize=20;strokeWidth=2" value="TableLine System&#xa;Web &amp;amp; Mobile Interface + Backend" vertex="1">
          <mxGeometry height="102" width="230" x="65" y="197" as="geometry" />
        </mxCell>
        <mxCell id="stsY131Qkb1uQlxCJsp2-5" parent="1" style="rounded=1;arcSize=20;strokeWidth=2" value="Notification Service&#xa;Email / SMS" vertex="1">
          <mxGeometry height="78" width="171" x="169" y="398" as="geometry" />
        </mxCell>
        <mxCell id="stsY131Qkb1uQlxCJsp2-6" edge="1" parent="1" source="stsY131Qkb1uQlxCJsp2-2" style="curved=1;startArrow=none;endArrow=block;exitX=0.31;exitY=1;entryX=0.31;entryY=0;rounded=0;" target="stsY131Qkb1uQlxCJsp2-4" value="Joins waitlist, Views position">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="115" y="123" />
              <mxPoint x="115" y="172" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="stsY131Qkb1uQlxCJsp2-7" edge="1" parent="1" source="stsY131Qkb1uQlxCJsp2-3" style="curved=1;startArrow=none;endArrow=block;exitX=0.37;exitY=1;entryX=0.95;entryY=0;rounded=0;" target="stsY131Qkb1uQlxCJsp2-4" value="Manages services, Seats parties, Updates queue">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="335" y="123" />
              <mxPoint x="335" y="172" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="stsY131Qkb1uQlxCJsp2-8" edge="1" parent="1" source="stsY131Qkb1uQlxCJsp2-4" style="curved=1;startArrow=none;endArrow=block;exitX=0.5;exitY=1;entryX=0.28;entryY=0;rounded=0;" target="stsY131Qkb1uQlxCJsp2-5" value="Triggers &#39;Table Ready&#39; alerts">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="180" y="361" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="stsY131Qkb1uQlxCJsp2-9" edge="1" parent="1" source="stsY131Qkb1uQlxCJsp2-5" style="curved=1;dashed=1;dashPattern=2 3;startArrow=none;endArrow=block;exitX=1;exitY=0.2;entryX=1;entryY=0.74;rounded=0;" target="stsY131Qkb1uQlxCJsp2-2" value="Sends SMS/Email updates">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="531" y="361" />
              <mxPoint x="531" y="123" />
            </Array>
          </mxGeometry>
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
ment1 graph2.drawio…]()


We’ll use GitHub issues to break tasks into user stories, and commits/pull requests to show each person’s contribution.

Team COntributions for A1:
Team Contributions (IMPORTANT)
## Team Contributions
| Name | Contribution | Notes |
- Ishita Uddarraju |  Led the initial system design and documentation by drafting the Initial Thoughts, Development Methodology, and High-Level Architecture sections. Answered all required assignment questions after discussing design decisions with the team. | No notes.
- Chan-Vu Nguyen | Wrote and added the High-Level Architecture section (Part 3) and committed updates to the system design document on GitHub. | No notes. |
- Huxley Taganahan | Created the system context diagram and reorganized the document | No notes. |

import { getDB, saveDB } from '../../lib/db';
import { sanitizeObject, sanitizeString, checkRateLimit, validateAdminRequest } from '../../lib/security';

export default function handler(req, res) {
  const db = getDB();
  db.team = db.team || [];
  db.companyStory = db.companyStory || {};

  // -------------------------------------------------------------
  // GET: FETCH TEAM & STORY (Public)
  // -------------------------------------------------------------
  if (req.method === 'GET') {
    return res.status(200).json({
      team: db.team,
      companyStory: db.companyStory
    });
  }

  // ALL OTHER ACTIONS (POST, PUT, DELETE) REQUIRE VALID ADMIN BEARER TOKEN
  const adminUser = validateAdminRequest(req, res);
  if (!adminUser) return;

  // -------------------------------------------------------------
  // POST: ADD NEW TEAM MEMBER (Admin Only)
  // -------------------------------------------------------------
  if (req.method === 'POST') {
    const sanitizedBody = sanitizeObject(req.body);
    const { name, role, bio, image, location, speciality } = sanitizedBody;

    if (!name || !role) {
      return res.status(400).json({ error: 'Name and Role are required.' });
    }

    const newMember = {
      id: Date.now(),
      name: sanitizeString(name, 80),
      role: sanitizeString(role, 100),
      bio: sanitizeString(bio || '', 500),
      image: sanitizeString(image || '/images/ner_logo_icon.jpg', 255),
      location: sanitizeString(location || 'Assam, India', 80),
      speciality: sanitizeString(speciality || 'North Eastern Heritage', 100)
    };

    db.team.push(newMember);
    saveDB(db);

    return res.status(201).json({ success: true, team: db.team, newMember });
  }

  // -------------------------------------------------------------
  // PUT: UPDATE TEAM MEMBER OR COMPANY STORY (Admin Only)
  // -------------------------------------------------------------
  if (req.method === 'PUT') {
    const sanitizedBody = sanitizeObject(req.body);

    // Case A: Update Company Story
    if (sanitizedBody.updateStory) {
      const { headline, narrative, mission, commitments } = sanitizedBody;
      db.companyStory = {
        headline: sanitizeString(headline || db.companyStory.headline || '', 150),
        narrative: sanitizeString(narrative || db.companyStory.narrative || '', 1000),
        mission: sanitizeString(mission || db.companyStory.mission || '', 500),
        commitments: Array.isArray(commitments)
          ? commitments.map(c => sanitizeString(c, 150))
          : (db.companyStory.commitments || [])
      };
      saveDB(db);
      return res.status(200).json({ success: true, companyStory: db.companyStory });
    }

    // Case B: Update Team Member
    const { id, name, role, bio, image, location, speciality } = sanitizedBody;
    if (!id) return res.status(400).json({ error: 'Team member ID required' });

    const memberIndex = db.team.findIndex(m => String(m.id) === String(id));
    if (memberIndex === -1) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    db.team[memberIndex] = {
      ...db.team[memberIndex],
      name: sanitizeString(name || db.team[memberIndex].name, 80),
      role: sanitizeString(role || db.team[memberIndex].role, 100),
      bio: sanitizeString(bio !== undefined ? bio : db.team[memberIndex].bio, 500),
      image: sanitizeString(image || db.team[memberIndex].image, 255),
      location: sanitizeString(location || db.team[memberIndex].location, 80),
      speciality: sanitizeString(speciality || db.team[memberIndex].speciality, 100)
    };

    saveDB(db);
    return res.status(200).json({ success: true, team: db.team });
  }

  // -------------------------------------------------------------
  // DELETE: REMOVE TEAM MEMBER (Admin Only)
  // -------------------------------------------------------------
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Team member ID required' });

    db.team = db.team.filter(m => String(m.id) !== String(id));
    saveDB(db);

    return res.status(200).json({ success: true, team: db.team });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

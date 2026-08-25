const Scenario = require('../models/Scenario');
const UnmatchedScenario = require('../models/UnmatchedScenario');
const { getEmbedding } = require('../services/scenarioService');
const SCENARIO_CATEGORIES = ['workload', 'management', 'compensation', 'culture', 'tools_process', 'harassment_safety', 'other'];

const getScenarios = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) query.$or = [{ category: new RegExp(search, 'i') }, { triggerPatterns: new RegExp(search, 'i') }, { responseTemplate: new RegExp(search, 'i') }];
    res.json(await Scenario.find(query).populate('createdBy', 'name email').sort({ updatedAt: -1 }));
  } catch (error) { res.status(500).json({ message: 'Failed to load scenarios.' }); }
};

const updateScenario = async (req, res) => {
  try {
    const scenario = await Scenario.findByIdAndUpdate(req.params.id, { ...req.body }, { new: true, runValidators: true });
    if (!scenario) return res.status(404).json({ message: 'Scenario not found.' });
    res.json(scenario);
  } catch (error) { res.status(400).json({ message: 'Failed to update scenario.' }); }
};

const deleteScenario = async (req, res) => {
  try {
    const scenario = await Scenario.findByIdAndDelete(req.params.id);
    if (!scenario) return res.status(404).json({ message: 'Scenario not found.' });
    res.json({ message: 'Scenario deleted.' });
  } catch (error) { res.status(500).json({ message: 'Failed to delete scenario.' }); }
};

const getUnmatchedScenarios = async (req, res) => {
  const query = req.query.status ? { status: req.query.status } : {};
  try { res.json(await UnmatchedScenario.find(query).populate('reviewedBy', 'name email').sort({ createdAt: -1 })); } catch (error) { res.status(500).json({ message: 'Failed to load unmatched scenarios.' }); }
};

const createScenarioFromUnmatched = async (req, res) => {
  try {
    const unmatched = await UnmatchedScenario.findById(req.params.unmatchedId);
    if (!unmatched) return res.status(404).json({ message: 'Unmatched scenario not found.' });
    const requestedCategory = req.body.category || unmatched.attemptedCategory;
    const triggerPatterns = req.body.triggerPatterns || [unmatched.rawMessage];
    const scenario = await Scenario.create({
      triggerPatterns,
      category: SCENARIO_CATEGORIES.includes(requestedCategory) ? requestedCategory : 'other',
      sentimentRange: req.body.sentimentRange,
      responseTemplate: req.body.responseTemplate || '',
      embedding: req.body.embedding || await getEmbedding(`${triggerPatterns.join(' ')} ${req.body.responseTemplate || ''}`),
      escalationRequired: req.body.escalationRequired,
      confidenceThreshold: req.body.confidenceThreshold,
      createdBy: req.user.id
    });
    unmatched.status = 'converted_to_scenario';
    unmatched.reviewedBy = req.user.id;
    await unmatched.save();
    res.status(201).json({ scenario, unmatched });
  } catch (error) { res.status(400).json({ message: 'Failed to convert unmatched scenario.' }); }
};

module.exports = { getScenarios, updateScenario, deleteScenario, getUnmatchedScenarios, createScenarioFromUnmatched };
const Experience = require("../../../Models/User/experience");

exports.getExperience = async (req, res) => {
  try {
    const experience = await Experience.findAll({
      where: { UserId: req.user.id },
      order: [['startDate', 'DESC']]
    });
    res.status(200).json(experience);
  } catch (error) {
    console.error('Error fetching experience:', error);
    res.status(500).json({ message: 'Error fetching experience', error: error.message });
  }
};

exports.addExperience = async (req, res) => {
  try {
    const { company, position, startDate, endDate, description, location, employmentType } = req.body;
    
    if(!company || !position || !startDate){
      return res.status(400).json({ message: 'Company, position and start date are required' });
    }

    const experience = await Experience.create({
      company,
      position,
      startDate,
      endDate,
      description,
      location,
      employmentType,
      UserId: req.user.id
    });

    res.status(201).json({ message: 'Experience added successfully', experience });
  } catch (error) {
    console.error('Error adding experience:', error);
    res.status(500).json({ message: 'Error adding experience', error: error.message });
  }
};

exports.updateExperience = async (req, res) => {
  try {
    const { id } = req.body;
    const { company, position, startDate, endDate, description, location, employmentType } = req.body;

    if(!id){
      return res.status(400).json({ message: 'Id is required' });
    }

    const experience = await Experience.findOne({
      where: { id, UserId: req.user.id }
    });

    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    await experience.update({
      company,
      position,
      startDate,
      endDate,
      description,
      location,
      employmentType
    });

    res.status(200).json({ message: 'Experience updated successfully', experience });
  } catch (error) {
    console.error('Error updating experience:', error);
    res.status(500).json({ message: 'Error updating experience', error: error.message });
  }
};

exports.deleteExperience = async (req, res) => {
  try {
    const { id } = req.body;

    if(!id){
      return res.status(400).json({ message: 'Id is required' });
    }

    const experience = await Experience.findOne({
      where: { id, UserId: req.user.id }
    });

    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    await experience.destroy();
    res.status(200).json({ message: 'Experience deleted successfully' });
  } catch (error) {
    console.error('Error deleting experience:', error);
    res.status(500).json({ message: 'Error deleting experience', error: error.message });
  }
};

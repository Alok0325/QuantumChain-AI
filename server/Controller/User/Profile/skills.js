const Skills = require("../../../Models/User/skills");

exports.getSkills = async (req, res) => {
  try {
    const skills = await Skills.findAll({
      where: { UserId: req.user.id },
      order: [['level', 'DESC']]
    });
    res.status(200).json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ message: 'Error fetching skills', error: error.message });
  }
};

exports.addSkills = async (req, res) => {
  try {
    const { name, level, yearsOfExperience, category } = req.body;

    if(!name){
      return res.status(400).json({ message: 'Name is required' });
    }

    const skill = await Skills.create({
      name,
      level,
      yearsOfExperience,
      category,
      UserId: req.user.id
    });

    res.status(201).json({ message: 'Skill added successfully', skill });
  } catch (error) {
    console.error('Error adding skill:', error);
    res.status(500).json({ message: 'Error adding skill', error: error.message });
  }
};

exports.updateSkills = async (req, res) => {
  try {
    const { id } = req.body;
    const { name, level, yearsOfExperience, category } = req.body;

    if(!id){
      return res.status(400).json({ message: 'Id is required' });
    }

    const skill = await Skills.findOne({
      where: { id, UserId: req.user.id }
    });

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    await skill.update({
      name,
      level,
      yearsOfExperience,
      category
    });

    res.status(200).json({ message: 'Skill updated successfully', skill });
  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).json({ message: 'Error updating skill', error: error.message });
  }
};

exports.deleteSkills = async (req, res) => {
  try {
    const { id } = req.body;

    if(!id){
      return res.status(400).json({ message: 'Id is required' });
    }

    const skill = await Skills.findOne({
      where: { id, UserId: req.user.id }
    });

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    await skill.destroy();
    res.status(200).json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ message: 'Error deleting skill', error: error.message });
  }
};

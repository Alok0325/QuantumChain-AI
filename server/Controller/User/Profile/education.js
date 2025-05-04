const Education = require("../../../Models/User/education");

exports.getEducation = async (req, res) => {
  try {
    const education = await Education.findAll({
      where: { UserId: req.user.id },
      order: [['startDate', 'DESC']]
    });
    res.status(200).json(education);
  } catch (error) {
    console.error('Error fetching education:', error);
    res.status(500).json({ message: 'Error fetching education', error: error.message });
  }
};

exports.addEducation = async (req, res) => {
  try {
    const { institution, degree, fieldOfStudy, startDate, endDate, grade, description } = req.body;
    
   
    if(!institution ||!startDate){
      return res.status(400).json({ message: 'Institution and start date are required' });
    }
    const education = await Education.create({
      institution,
      degree,
      fieldOfStudy,
      startDate,
      endDate,
      grade,
      description,
      UserId: req.user.id
    });

    res.status(201).json({ message: 'Education added successfully', education });
  } catch (error) {
    console.error('Error adding education:', error);
    res.status(500).json({ message: 'Error adding education', error: error.message });
  }
};

exports.updateEducation = async (req, res) => {
  try {
    const { id } = req.body;
    const { institution, degree, fieldOfStudy, startDate, endDate, grade, description } = req.body;

    if(!id){
      return res.status(400).json({ message: 'Id is required' });
    }

    const education = await Education.findOne({
      where: { id, UserId: req.user.id }
    });

    if (!education) {
      return res.status(404).json({ message: 'Education not found' });
    }

    await education.update({
      institution,
      degree,
      fieldOfStudy,
      startDate,
      endDate,
      grade,
      description
    });

    res.status(200).json({ message: 'Education updated successfully', education });
  } catch (error) {
    console.error('Error updating education:', error);
    res.status(500).json({ message: 'Error updating education', error: error.message });
  }
};

exports.deleteEducation = async (req, res) => {
  try {
    const { id } = req.params;

    const education = await Education.findOne({
      where: { id, UserId: req.user.id }
    });

    if (!education) {
      return res.status(404).json({ message: 'Education not found' });
    }

    await education.destroy();
    res.status(200).json({ message: 'Education deleted successfully' });
  } catch (error) {
    console.error('Error deleting education:', error);
    res.status(500).json({ message: 'Error deleting education', error: error.message });
  }
};

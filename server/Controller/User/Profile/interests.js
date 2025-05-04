const Interests = require("../../../Models/User/interests");

exports.getInterests = async (req, res) => {
  try {
    const interests = await Interests.findOne({
      where: { UserId: req.user.id }
    });
    res.status(200).json(interests);
  } catch (error) {
    console.error('Error fetching interests:', error);
    res.status(500).json({ message: 'Error fetching interests', error: error.message });
  }
};

exports.updateInterests = async (req, res) => {
  try {
    const { preferredJobTypes, preferredLocations, preferredIndustries, preferredRoles, workMode, expectedSalary, currentSalary } = req.body;

    let interests = await Interests.findOne({
      where: { UserId: req.user.id }
    });

    if (!interests) {
      // Create new interests if none exist
      interests = await Interests.create({
        preferredJobTypes,
        preferredLocations,
        preferredIndustries,
        preferredRoles,
        workMode,
        expectedSalary,
        currentSalary,
        UserId: req.user.id
      });
    } else {
      // Update existing interests
      await interests.update({
        preferredJobTypes,
        preferredLocations,
        preferredIndustries,
        preferredRoles,
        workMode,
        expectedSalary,
        currentSalary
      });
    }

    res.status(200).json({ message: 'Interests updated successfully', interests });
  } catch (error) {
    console.error('Error updating interests:', error);
    res.status(500).json({ message: 'Error updating interests', error: error.message });
  }
};


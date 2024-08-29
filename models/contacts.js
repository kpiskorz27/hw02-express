const Contact = require("./contact");

const listContacts = async () => {
  try {
    const contacts = await Contact.find({});
    return contacts;
  } catch (error) {
    throw new Error(`Error retrieving contacts: ${error.message}`);
  }
};

const getContactById = async (contactId) => {
  try {
    const contact = await Contact.findById(contactId);
    return contact || null;
  } catch (error) {
    throw new Error(`Error retrieving contact by ID: ${error.message}`);
  }
};

const removeContact = async (contactId) => {
  try {
    const contact = await Contact.findByIdAndRemove(contactId);
    return contact || null;
  } catch (error) {
    throw new Error(`Error removing contact: ${error.message}`);
  }
};

const addContact = async (body) => {
  try {
    const newContact = new Contact(body);
    const savedContact = await newContact.save();
    return savedContact;
  } catch (error) {
    throw new Error(`Error adding contact: ${error.message}`);
  }
};

const updateContact = async (contactId, body) => {
  try {
    const updatedContact = await Contact.findByIdAndUpdate(contactId, body, {
      new: true,
    });
    return updatedContact || null;
  } catch (error) {
    throw new Error(`Error updating contact: ${error.message}`);
  }
};

const updateStatusContact = async (contactId, { favorite }) => {
  try {
    const updatedContact = await Contact.findByIdAndUpdate(
      contactId,
      { favorite },
      { new: true }
    );
    return updatedContact || null;
  } catch (error) {
    throw new Error(`Error updating contact status: ${error.message}`);
  }
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
  updateStatusContact,
};

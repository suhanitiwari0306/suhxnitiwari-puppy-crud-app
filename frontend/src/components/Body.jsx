import React, { useState, useEffect } from "react";
import axios from "axios";
// import { useAuthContext } from "@asgardeo/auth-react";
import { useAsgardeo, SignedIn, SignedOut } from '@asgardeo/react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Body = () => {
  const { getAccessToken } = useAsgardeo();

  const [puppies, setPuppies] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    age: "",
  });

  // FETCH PUPPIES (only when signed in)
  const fetchPuppies = React.useCallback(async () => {
    try {
      const token = await getAccessToken();
      const response = await axios.get(`${API_BASE_URL}/puppies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPuppies(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching puppies:", error);
      setPuppies([]);
    }
  }, [getAccessToken]);

  // Only run effect when user is signed in
  const { isAuthenticated } = useAsgardeo();
  React.useEffect(() => {
    if (isAuthenticated) {
      fetchPuppies();
    }
  }, [isAuthenticated, fetchPuppies]);

  // HANDLE INPUT
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // SUBMIT (CREATE / UPDATE)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = await getAccessToken();
      console.log('JWT token being sent:', token);

      if (editingId) {
        // UPDATE
        await axios.put(
          `${API_BASE_URL}/puppies/${editingId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setEditingId(null);
      } else {
        // CREATE
        await axios.post(`${API_BASE_URL}/puppies`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      setFormData({
        name: "",
        breed: "",
        age: "",
      });

      fetchPuppies();
    } catch (error) {
      console.error("Error saving puppy:", error);
    }
  };

  // EDIT
  const handleEdit = (puppy) => {
    setEditingId(puppy.id);
    setFormData({
      name: puppy.name,
      breed: puppy.breed,
      age: puppy.age,
    });
  };

  // DELETE
  const handleDelete = async (id) => {
    try {
      const token = await getAccessToken();

      await axios.delete(`${API_BASE_URL}/puppies/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchPuppies();
    } catch (error) {
      console.error("Error deleting puppy:", error);
    }
  };

  return (
    <>
      {/* NOT SIGNED IN */}
      <SignedOut>
        <main className="body-container">
          <section className="form-section">
            <h2>Please sign in to manage your puppies.</h2>
          </section>
        </main>
      </SignedOut>

      {/* SIGNED IN */}
      <SignedIn>
        <main className="body-container">
          {/* FORM */}
          <section className="form-section">
            <h2>{editingId ? "Edit Puppy" : "Add Puppy"}</h2>

            <form className="puppy-form" onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="breed"
                placeholder="Breed"
                value={formData.breed}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="age"
                placeholder="Age"
                value={formData.age}
                onChange={handleChange}
                required
              />
              <button className="add-btn" type="submit">
                {editingId ? "Update Puppy" : "Add Puppy"}
              </button>
            </form>
          </section>

          {/* TABLE */}
          <section className="table-section">
            <h2>Your Puppies</h2>

            <table className="puppy-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Breed</th>
                  <th>Age</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {puppies.length === 0 ? (
                  <tr>
                    <td colSpan="4">No puppies found.</td>
                  </tr>
                ) : (
                  puppies.map((puppy) => (
                    <tr key={puppy.id}>
                      <td>{puppy.name}</td>
                      <td>{puppy.breed}</td>
                      <td>{puppy.age}</td>
                      <td>
                        <button className="edit-btn" type="button" onClick={() => handleEdit(puppy)}>
                          Edit
                        </button>
                        <button className="delete-btn" type="button" onClick={() => handleDelete(puppy.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </main>
      </SignedIn>
    </>
  );
};

export default Body;
/**
 * Task Management Service
 * Handles tasks, projects, and assignments
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

export async function createTask({ title, description, priority, dueDate, userId, groupId, projectId }) {
  const taskData = {
    title,
    description,
    priority,
    dueDate: dueDate ? new Date(dueDate) : null,
    status: 'pending',
    userId,
    groupId,
    projectId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: null,
    assignedTo: [],
    tags: [],
    estimatedHours: null,
    actualHours: null
  };

  const docRef = await addDoc(collection(db, 'tasks'), taskData);
  return { id: docRef.id, ...taskData };
}

export async function getTasks({ userId, groupId, projectId }) {
  let tasksQuery = collection(db, 'tasks');
  
  const constraints = [orderBy('createdAt', 'desc')];
  
  if (groupId) {
    constraints.unshift(where('groupId', '==', groupId));
  } else {
    constraints.unshift(where('userId', '==', userId));
  }
  
  if (projectId) {
    constraints.unshift(where('projectId', '==', projectId));
  }

  tasksQuery = query(tasksQuery, ...constraints);
  const snapshot = await getDocs(tasksQuery);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
    completedAt: doc.data().completedAt?.toDate(),
    dueDate: doc.data().dueDate?.toDate()
  }));
}

export async function updateTask(taskId, updates) {
  await updateDoc(doc(db, 'tasks', taskId), {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function deleteTask(taskId) {
  await deleteDoc(doc(db, 'tasks', taskId));
}

export async function createProject({ name, description, userId, groupId }) {
  const projectData = {
    name,
    description,
    userId,
    groupId,
    createdAt: serverTimestamp(),
    status: 'active',
    color: '#3b82f6'
  };

  const docRef = await addDoc(collection(db, 'projects'), projectData);
  return { id: docRef.id, ...projectData };
}

export async function getProjects({ userId, groupId }) {
  let projectsQuery = collection(db, 'projects');
  
  if (groupId) {
    projectsQuery = query(projectsQuery, where('groupId', '==', groupId));
  } else {
    projectsQuery = query(projectsQuery, where('userId', '==', userId));
  }

  const snapshot = await getDocs(projectsQuery);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate()
  }));
}
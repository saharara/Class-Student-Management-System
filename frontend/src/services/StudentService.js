import api from './OdooApiService';

const STUDENT_ENDPOINT = '/edmanage-student';

const studentService = {};

studentService.getHobbies = () => api({
  url: `${STUDENT_ENDPOINT}/hobbies`,
  method: 'get',
});

studentService.getAll = params => api({
  url: STUDENT_ENDPOINT,
  method: 'get',
  params,
});

studentService.getPage = (page = 1, params = {}) => api({
  url: `${STUDENT_ENDPOINT}/page/${page}`,
  method: 'get',
  params,
});

studentService.getById = (id, params = {}) => api({
  url: `${STUDENT_ENDPOINT}/${id}`,
  method: 'get',
  params,
});

studentService.create = data => api({
  url: STUDENT_ENDPOINT,
  method: 'post',
  data,
});

studentService.update = (id, data) => api({
  url: `${STUDENT_ENDPOINT}/${id}`,
  method: 'put',
  data,
});

studentService.remove = id => api({
  url: `${STUDENT_ENDPOINT}/${id}`,
  method: 'delete',
});

studentService.copy = id => api({
  url: `${STUDENT_ENDPOINT}/${id}`,
  method: 'post',
  data: { action: 'copy' },
});

studentService.massDelete = ids => api({
  url: `${STUDENT_ENDPOINT}/delete`,
  method: 'delete',
  data: { idlist: ids },
});

studentService.massCopy = ids => api({
  url: `${STUDENT_ENDPOINT}/copy`,
  method: 'post',
  data: { idlist: ids },
});

export default studentService;

import api from './OdooApiService';

const CLASS_ENDPOINT = '/edmanage-class';

const classroomService = {};

classroomService.getAll = params => api({
  url: CLASS_ENDPOINT,
  method: 'get',
  params,
});

classroomService.getPage = (page = 1, params = {}) => api({
  url: `${CLASS_ENDPOINT}/page/${page}`,
  method: 'get',
  params,
});

classroomService.getById = (id, params = {}) => api({
  url: `${CLASS_ENDPOINT}/${id}`,
  method: 'get',
  params,
});

classroomService.create = data => api({
  url: CLASS_ENDPOINT,
  method: 'post',
  data,
});

classroomService.update = (id, data) => api({
  url: `${CLASS_ENDPOINT}/${id}`,
  method: 'put',
  data,
});

classroomService.remove = (id, data = {}) => api({
  url: `${CLASS_ENDPOINT}/${id}`,
  method: 'delete',
  data,
});

classroomService.copy = id => api({
  url: `${CLASS_ENDPOINT}/${id}`,
  method: 'post',
  data: { action: 'copy' },
});

classroomService.massDelete = (ids, data = {}) => api({
  url: `${CLASS_ENDPOINT}/delete`,
  method: 'delete',
  data: { idlist: ids, ...data },
});

classroomService.massCopy = ids => api({
  url: `${CLASS_ENDPOINT}/copy`,
  method: 'post',
  data: { idlist: ids },
});

export default classroomService;

'use strict'

function appendQueryPaging(query, page, pageSize) {
  if (!page || !pageSize) {
    return query
  }

  const offset = (page - 1) * pageSize
  if (offset > 0) {
    query = query.skip(offset)
  }
  query = query.limit(pageSize)
  return query
}

function appendQuerySort(query, sortField, sortOrder) {
  if (sortField) {
    if (sortOrder === 'descend') {
      query = query.sort({[sortField]: -1})
    } else {
      query = query.sort(sortField)
    }
  }
  return query
}

function constructQueryFilter(option, value, field, strict = false) {
  if (!value) {
    return
  }

  if (!option['$and']) {
    option['$and'] = []
  }

  const condi = option['$and']

  if (value instanceof Array) {
    if (strict) {
      condi.push({
        $or: value.map(n => ({[field]: n}))
      })
    } else {
      condi.push({
        $or: value.map(n => ({[field]: new RegExp('^' + n + '$', 'i')}))
      })
    }
  } else {
    condi.push({
      [field]: strict ? value : new RegExp('^' + value + '$', 'i')
    })
  }
}

module.exports = {
  appendQuerySort,
  appendQueryPaging,
  constructQueryFilter
}

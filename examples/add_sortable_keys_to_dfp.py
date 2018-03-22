#!/usr/bin/env python

"""
This code adapts from the examples provided by the GoogleAds Python library
to add the specific targeting keys required by sortable to provide analytics.
The LoadFromStorage method is pulling credentials and properties from a
"googleads.yaml" file. By default, it looks for this file in your home
directory. For more information, see the "Caching authentication information"
section of the googleads README at github.com/googleads/googleads-python-lib.
"""

import time
from googleads import dfp

# Number of values to send per request, and timeout between requests
# Play with these if you find Google is throttling you. This will only
# try to add missing values, and will skip existing ones.
CHUNK_SIZE = 500
TIMEOUT = 0

# Our keys are typically prefixed to avoid conflicts with existing keys.
KEY_PREFIX = 'srt_'

# For base 36 encoding
ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

def get_or_create_key(custom_targeting_service, key_name):
  """ Get or create a Sortable Key Value with name key_name,
  reactivating it if it was deleted and returning its id """

  statement = (dfp.StatementBuilder()
               .Where('name = :keyName')
               .WithBindVariable('keyName', key_name)).ToStatement()
  response = custom_targeting_service.getCustomTargetingKeysByStatement(statement)

  if response.totalResultSetSize == 1:
    action = {'xsi_type': 'ActivateCustomTargetingKeys'}
    custom_targeting_service.performCustomTargetingKeyAction(action, statement)
    return response.results[0].id
  elif response.totalResultSetSize == 0:
    keys = custom_targeting_service.createCustomTargetingKeys({'displayName': 'Sortable Key Value',
                                                               'name': key_name,
                                                               'type': 'PREDEFINED'})
    return keys[0].id
  else:
    raise Exception('Multiple keys found with name ' + key_name)


def get_values_for_key(custom_targeting_service, key_id):
  """ Based on the example get_predefined_custom_targeting_keys_and_values.py """
  # Get custom targeting keys by statement.
  # Create a statement to select custom targeting values.
  statement = (dfp.StatementBuilder()
               .Where('customTargetingKeyId IN (:ids)')
               .WithBindVariable('ids', [key_id]))

  # Retrieve a small amount of custom targeting values at a time, paging
  # through until all custom targeting values have been retrieved.
  values = set()

  while True:
    response = custom_targeting_service.getCustomTargetingValuesByStatement(
        statement.ToStatement())
    if 'results' in response:
      active_values = [x for x in response['results'] if x['status'] == 'ACTIVE']
      values = values.union(set([v['name'] for v in active_values]))
      statement.offset += statement.limit
    else:
      break

  print '\nNumber of results found: %s' % response['totalResultSetSize']
  return values


def throttled_create_values(custom_targeting_service, key_id, values, chunk_size):
  """ Send the keys to Google in chunks """
  chunk = []
  for i, value in enumerate(values):
    chunk.append({'name': str(value), 'customTargetingKeyId':key_id})
    if (i+1)%chunk_size == 0 or i == len(values) - 1:
      print i, "... adding more values to the key!"
      custom_targeting_service.createCustomTargetingValues(chunk)
      time.sleep(TIMEOUT)
      chunk = []


def upsert_values(custom_targeting_service, key_id, desired_values):
  """ Create the values on the existing key, if they aren't there yet """
  existing_values = get_values_for_key(custom_targeting_service, key_id)
  missing_values = desired_values.difference(existing_values)
  print "Need to create " + str(len(missing_values)) + " values"
  throttled_create_values(custom_targeting_service, key_id, missing_values, CHUNK_SIZE)


def base36encode(number):
  """ Convert a number to its base-36 string representations """
  base36 = ''

  while number:
    number, i = divmod(number, 36)
    base36 = ALPHABET[i] + base36

  return base36 or ALPHABET[0]

def add_sortable_keys():
  """ Adds all keys necessary for Sortable Analytics """

  # Initialize client object.
  dfp_client = dfp.DfpClient.LoadFromStorage()

  service = dfp_client.GetService('CustomTargetingService', version='v201802')

  r = [KEY_PREFIX + 'r', set(map(str, range(2048)))]
  u = [KEY_PREFIX + 'u', set(map(base36encode, range(100000)))]
  u2 = [KEY_PREFIX + 'u2', set(map(base36encode, range(100000)))]
  u3 = [KEY_PREFIX + 'u3', set(map(base36encode, range(100000)))]
  u4 = [KEY_PREFIX + 'u4', set(map(base36encode, range(100000)))]
  u5 = [KEY_PREFIX + 'u5', set(map(base36encode, range(100000)))]

  for key_name, values in [r, u, u2, u3, u4, u5]:
    key_id = get_or_create_key(service, key_name)
    upsert_values(service, key_id, values)


if __name__ == '__main__':
  add_sortable_keys()


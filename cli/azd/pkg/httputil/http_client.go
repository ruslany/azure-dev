// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package httputil

import (
	"net/http"
)

type HttpClient interface {
	Do(req *http.Request) (*http.Response, error)
}
